/**
 * Auto Review Agent
 *
 * Processes pending submissions from the `submissions` Firestore collection,
 * runs validation and scoring checks, and auto-approves high-confidence
 * submissions by creating real entity documents.
 *
 * Scoring (0-100):
 *   URL reachable      +30
 *   Description quality +25
 *   Has provider       +15
 *   Has category       +15
 *   Has tags           +15
 *
 * Threshold: score >= 70 => auto-approve
 * Max per run: 10 submissions
 *
 * Schedule: daily (after ingest)
 * Idempotent: yes — only processes status == "pending"
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "auto-review-agent";
const MAX_PER_RUN = 10;
const VALID_TYPES = ["tool", "model", "agent", "skill", "script", "benchmark"] as const;
const COLLECTION_MAP: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

/**
 * Generate a URL-safe slug from a name.
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Check if a URL is reachable via HEAD request with 5s timeout.
 */
async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

/**
 * Check if an entity with the same name (case-insensitive) already exists
 * in the target collection.
 */
async function isDuplicate(name: string, collection: string): Promise<boolean> {
  const snap = await db.collection(collection).get();
  const lowerName = name.toLowerCase();
  return snap.docs.some((doc) => {
    const docName = doc.data().name;
    return typeof docName === "string" && docName.toLowerCase() === lowerName;
  });
}

interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

/**
 * Run validation checks on a submission entity.
 */
function validateSubmission(entity: Record<string, unknown>): ValidationResult {
  const reasons: string[] = [];

  if (!entity.name || typeof entity.name !== "string" || entity.name.trim().length === 0) {
    reasons.push("Name is empty");
  }

  const desc = typeof entity.description === "string" ? entity.description : "";
  if (desc.length < 20) {
    reasons.push(`Description too short (${desc.length} chars, need 20+)`);
  }
  if (desc.includes("[unverified]")) {
    reasons.push("Description contains [unverified]");
  }

  const type = typeof entity.type === "string" ? entity.type : "";
  if (!VALID_TYPES.includes(type as typeof VALID_TYPES[number])) {
    reasons.push(`Invalid type "${type}"`);
  }

  return { valid: reasons.length === 0, reasons };
}

/**
 * Score a submission 0-100 based on data quality signals.
 */
function scoreSubmission(
  entity: Record<string, unknown>,
  urlReachable: boolean,
): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    urlReachable: 0,
    descriptionQuality: 0,
    hasProvider: 0,
    hasCategory: 0,
    hasTags: 0,
  };

  // URL reachable (+30)
  if (urlReachable) {
    breakdown.urlReachable = 30;
  }

  // Description quality (+25)
  const desc = typeof entity.description === "string" ? entity.description : "";
  if (desc.length >= 20 && !desc.includes("[unverified]")) {
    breakdown.descriptionQuality = 25;
  }

  // Has provider (+15)
  if (
    entity.provider &&
    typeof entity.provider === "string" &&
    entity.provider.trim().length > 0 &&
    entity.provider !== "[unverified]"
  ) {
    breakdown.hasProvider = 15;
  }

  // Has category (+15)
  if (
    entity.category &&
    typeof entity.category === "string" &&
    entity.category.trim().length > 0 &&
    entity.category !== "uncategorized"
  ) {
    breakdown.hasCategory = 15;
  }

  // Has tags (+15)
  if (Array.isArray(entity.tags) && entity.tags.length > 0) {
    breakdown.hasTags = 15;
  }

  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { score, breakdown };
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting auto-review of pending submissions...`);

  let processed = 0;
  let approved = 0;
  let deferred = 0;
  let skipped = 0;

  try {
    // Query pending submissions, oldest first, capped at MAX_PER_RUN
    const snap = await db
      .collection("submissions")
      .where("status", "==", "pending")
      .orderBy("submittedAt", "asc")
      .limit(MAX_PER_RUN)
      .get();

    if (snap.empty) {
      console.log(`[${AGENT_NAME}] No pending submissions found.`);
      await logAgentAction(AGENT_NAME, "review_complete", { processed: 0 }, true);
      return;
    }

    console.log(`[${AGENT_NAME}] Found ${snap.size} pending submission(s).`);

    for (const doc of snap.docs) {
      const submission = doc.data();
      const entity = (submission.entity ?? {}) as Record<string, unknown>;
      const name = typeof entity.name === "string" ? entity.name : "";

      console.log(`\n  Processing: "${name}" (${doc.id})`);
      processed++;

      // Validation gate
      const validation = validateSubmission(entity);
      if (!validation.valid) {
        console.log(`    SKIP — validation failed: ${validation.reasons.join("; ")}`);
        await doc.ref.update({
          reviewNotes: `Validation failed: ${validation.reasons.join("; ")}`,
        });
        skipped++;
        continue;
      }

      const type = entity.type as string;
      const collection = COLLECTION_MAP[type];

      // Dedup check
      const duplicate = await isDuplicate(name, collection);
      if (duplicate) {
        console.log(`    SKIP — duplicate entity exists in ${collection}`);
        await doc.ref.update({
          reviewNotes: `Duplicate: entity with name "${name}" already exists in ${collection}`,
        });
        skipped++;
        continue;
      }

      // URL check
      const url = typeof entity.url === "string" ? entity.url : "";
      const urlReachable = url.length > 0 ? await isUrlReachable(url) : false;
      console.log(`    URL reachable: ${urlReachable}`);

      // Score
      const { score, breakdown } = scoreSubmission(entity, urlReachable);
      console.log(`    Score: ${score}/100 (${JSON.stringify(breakdown)})`);

      if (score >= 70) {
        // Auto-approve: create entity document
        const slug = slugify(name);
        const now = new Date().toISOString();

        const entityDoc: Record<string, unknown> = {
          ...entity,
          slug,
          addedDate: now,
          lastUpdated: now,
          lastVerified: now,
          addedBy: AGENT_NAME,
          scores: {
            adoption: 0,
            quality: 0,
            freshness: 100,
            citations: 0,
            engagement: 0,
            composite: 0,
          },
        };

        await db.collection(collection).doc(slug).set(entityDoc);

        // Update submission status
        await doc.ref.update({
          status: "approved",
          reviewedBy: AGENT_NAME,
          reviewedAt: now,
          reviewScore: score,
          reviewBreakdown: breakdown,
        });

        approved++;
        console.log(`    APPROVED — created ${collection}/${slug}`);
      } else {
        // Low confidence — leave as pending with review notes
        const reasons: string[] = [];
        if (!urlReachable) reasons.push("URL not reachable");
        if (breakdown.descriptionQuality === 0) reasons.push("Description quality insufficient");
        if (breakdown.hasProvider === 0) reasons.push("Missing provider");
        if (breakdown.hasCategory === 0) reasons.push("Missing or uncategorized category");
        if (breakdown.hasTags === 0) reasons.push("No tags");

        await doc.ref.update({
          reviewNotes: `Low confidence (score: ${score}/100). Issues: ${reasons.join("; ")}`,
          reviewScore: score,
          reviewBreakdown: breakdown,
        });

        deferred++;
        console.log(`    DEFERRED — score ${score} < 70 threshold`);
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "review_complete",
      { processed, approved, deferred, skipped },
      true,
    );

    console.log(
      `\n[${AGENT_NAME}] Review complete. ${processed} processed, ${approved} approved, ${deferred} deferred, ${skipped} skipped.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "review_failed",
      { processed, approved, deferred, skipped },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Review failed:`, message);
    throw err;
  }
}

// Direct invocation
if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
