/**
 * Summary Agent
 *
 * Generates deterministic, template-based structured summaries for all entities.
 * No external AI API calls — summaries are derived purely from entity data fields
 * and scores using templates and heuristics.
 *
 * For each entity, produces:
 * - overview: 1-2 sentence summary from name + description + provider
 * - strengths: derived from highest-scoring dimensions (scores > 70)
 * - weaknesses: derived from lowest-scoring dimensions (scores < 40)
 * - positioning: market position based on category, pricing, and competitor relations
 * - recommendation: tier-based (A+, B, C, etc.) from composite score
 * - keyFacts: structured key-value pairs
 * - lastGenerated: timestamp
 *
 * Writes to `entity_summaries` collection with doc ID = `{type}_{slug}`.
 * Skips entities with summaries generated within the last 3 days.
 *
 * Schedule: daily (runs after "enrich" in daily-core)
 * Idempotent: yes
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "summary-agent";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];
const COLLECTION_TYPE_MAP: Record<string, string> = {
  tools: "tool",
  models: "model",
  agents: "agent",
  skills: "skill",
  scripts: "script",
  benchmarks: "benchmark",
};

/** 3 days in milliseconds */
const STALENESS_THRESHOLD_MS = 3 * 24 * 60 * 60 * 1000;

interface EntitySummary {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  positioning: string;
  recommendation: string;
  keyFacts: { label: string; value: string }[];
  lastGenerated: Date;
  entityType: string;
  entitySlug: string;
  entityName: string;
}

interface EntityScores {
  composite?: number;
  adoption?: number;
  quality?: number;
  freshness?: number;
  citations?: number;
  engagement?: number;
}

const SCORE_LABELS: Record<string, string> = {
  adoption: "Adoption",
  quality: "Quality",
  freshness: "Freshness",
  citations: "Citations",
  engagement: "Engagement",
};

const STRENGTH_TEMPLATES: Record<string, string> = {
  adoption: "Strong adoption across the ecosystem",
  quality: "High-quality implementation and documentation",
  freshness: "Actively maintained with recent updates",
  citations: "Widely cited and referenced in the community",
  engagement: "High community engagement and usage",
};

const WEAKNESS_TEMPLATES: Record<string, string> = {
  adoption: "Limited adoption — may lack ecosystem maturity",
  quality: "Quality concerns — documentation or implementation gaps",
  freshness: "Potentially stale — not recently updated",
  citations: "Low citation count — limited community recognition",
  engagement: "Low engagement — limited community interaction",
};

function getScoreDimensions(scores: EntityScores): { key: string; value: number }[] {
  const dims: { key: string; value: number }[] = [];
  for (const key of Object.keys(SCORE_LABELS)) {
    const val = scores[key as keyof EntityScores];
    if (typeof val === "number" && !isNaN(val)) {
      dims.push({ key, value: val });
    }
  }
  return dims;
}

function generateOverview(data: Record<string, unknown>): string {
  const name = String(data.name || "Unknown");
  const description = String(data.description || "");
  const provider = String(data.provider || "");
  const type = String(data.type || "entity");

  const providerClause = provider && provider !== "[unverified]"
    ? ` by ${provider}`
    : "";

  if (description && description !== "[unverified]") {
    // Trim description to first sentence if it's long
    const firstSentence = description.split(/\.\s/)[0];
    const trimmedDesc = firstSentence.length < 200
      ? firstSentence + (firstSentence.endsWith(".") ? "" : ".")
      : firstSentence.substring(0, 197) + "...";
    return `${name} is a ${type}${providerClause}. ${trimmedDesc}`;
  }

  return `${name} is a ${type}${providerClause}.`;
}

function generateStrengths(scores: EntityScores): string[] {
  const dims = getScoreDimensions(scores);
  return dims
    .filter((d) => d.value > 70)
    .sort((a, b) => b.value - a.value)
    .map((d) => STRENGTH_TEMPLATES[d.key])
    .filter(Boolean);
}

function generateWeaknesses(scores: EntityScores): string[] {
  const dims = getScoreDimensions(scores);
  return dims
    .filter((d) => d.value < 40)
    .sort((a, b) => a.value - b.value)
    .map((d) => WEAKNESS_TEMPLATES[d.key])
    .filter(Boolean);
}

function generatePositioning(data: Record<string, unknown>): string {
  const category = String(data.category || "general");
  const pricing = String(data.pricingModel || "unknown");
  const type = String(data.type || "entity");

  const relatedTools = Array.isArray(data.relatedTools) ? data.relatedTools : [];
  const relatedModels = Array.isArray(data.relatedModels) ? data.relatedModels : [];
  const relatedAgents = Array.isArray(data.relatedAgents) ? data.relatedAgents : [];
  const totalRelations = relatedTools.length + relatedModels.length + relatedAgents.length;

  const pricingPhrase: Record<string, string> = {
    free: "freely available",
    "open-source": "open-source",
    freemium: "freemium",
    paid: "commercially licensed",
  };

  const pricingDesc = pricingPhrase[pricing] || pricing;
  const connectionClause = totalRelations > 0
    ? ` with ${totalRelations} known ecosystem connection${totalRelations !== 1 ? "s" : ""}`
    : "";

  return `A ${pricingDesc} ${type} in the ${category} space${connectionClause}.`;
}

function generateRecommendation(composite: number): string {
  if (composite >= 90) {
    return "Best in class — a top-tier choice with exceptional scores across all dimensions.";
  }
  if (composite >= 80) {
    return "Highly recommended — strong performance and wide adoption make this a reliable pick.";
  }
  if (composite >= 70) {
    return "Solid choice — performs well overall with few notable gaps.";
  }
  if (composite >= 55) {
    return "Decent option — adequate for most use cases, but stronger alternatives may exist.";
  }
  if (composite >= 40) {
    return "Consider alternatives — significant gaps in key areas may limit effectiveness.";
  }
  return "Use with caution — low scores suggest limited maturity or ecosystem support.";
}

function getGradeLetter(composite: number): string {
  if (composite >= 90) return "A+";
  if (composite >= 80) return "A";
  if (composite >= 70) return "B+";
  if (composite >= 55) return "B";
  if (composite >= 40) return "C";
  return "D";
}

function generateKeyFacts(data: Record<string, unknown>): { label: string; value: string }[] {
  const facts: { label: string; value: string }[] = [];

  const provider = String(data.provider || "");
  if (provider && provider !== "[unverified]") {
    facts.push({ label: "Provider", value: provider });
  }

  const license = String(data.license || "");
  if (license && license !== "[unverified]") {
    facts.push({ label: "License", value: license });
  }

  const pricing = String(data.pricingModel || "");
  if (pricing) {
    facts.push({ label: "Pricing", value: pricing.charAt(0).toUpperCase() + pricing.slice(1) });
  }

  const version = String(data.version || "");
  if (version && version !== "[unverified]") {
    facts.push({ label: "Version", value: version });
  }

  const category = String(data.category || "");
  if (category) {
    facts.push({ label: "Category", value: category });
  }

  const composite = (data.scores as EntityScores)?.composite;
  if (typeof composite === "number") {
    facts.push({ label: "Grade", value: getGradeLetter(composite) });
  }

  return facts;
}

function buildSummary(data: Record<string, unknown>, type: string, slug: string): EntitySummary {
  const scores: EntityScores = (data.scores as EntityScores) || {};
  const composite = typeof scores.composite === "number" ? scores.composite : 50;

  return {
    overview: generateOverview(data),
    strengths: generateStrengths(scores),
    weaknesses: generateWeaknesses(scores),
    positioning: generatePositioning(data),
    recommendation: generateRecommendation(composite),
    keyFacts: generateKeyFacts(data),
    lastGenerated: new Date(),
    entityType: type,
    entitySlug: slug,
    entityName: String(data.name || slug),
  };
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting summary generation...`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  const now = Date.now();

  for (const collection of ENTITY_COLLECTIONS) {
    const type = COLLECTION_TYPE_MAP[collection];
    console.log(`\n  Scanning ${collection}...`);

    let snap;
    try {
      snap = await db.collection(collection).get();
    } catch (err) {
      console.error(`  Failed to read ${collection}:`, err);
      errors++;
      continue;
    }

    for (const docSnap of snap.docs) {
      const slug = docSnap.id;
      const data = docSnap.data();
      const summaryDocId = `${type}_${slug}`;

      try {
        // Check if summary is still fresh
        const existingRef = db.collection("entity_summaries").doc(summaryDocId);
        const existingSnap = await existingRef.get();

        if (existingSnap.exists()) {
          const existing = existingSnap.data();
          const lastGenerated = existing?.lastGenerated;
          if (lastGenerated) {
            const generatedAt = typeof lastGenerated.toMillis === "function"
              ? lastGenerated.toMillis()
              : new Date(lastGenerated).getTime();
            if (now - generatedAt < STALENESS_THRESHOLD_MS) {
              skipped++;
              continue;
            }
          }
        }

        const summary = buildSummary(data, type, slug);
        await existingRef.set(summary);
        processed++;
        console.log(`    [OK] ${summaryDocId}`);
      } catch (err) {
        errors++;
        console.error(`    [FAIL] ${summaryDocId}:`, err);
      }
    }
  }

  const message = `Generated ${processed} summaries, skipped ${skipped} fresh, ${errors} errors`;
  console.log(`\n  ${message}`);

  await logAgentAction(AGENT_NAME, "run_complete", {
    processed,
    skipped,
    errors,
  }, errors === 0, errors > 0 ? `${errors} entity summaries failed` : undefined);
}
