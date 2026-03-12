/**
 * Ingestion Agent
 *
 * Discovers new AI entities from curated API sources and creates submission
 * entries in the `submissions` collection for review. Uses real API calls
 * to GitHub, HuggingFace, and arXiv to find recent AI tools, models, and
 * research papers.
 *
 * Pipeline: discover -> deduplicate -> validate -> queue
 * Daily cap: 20 candidates per run
 *
 * Schedule: daily
 * Idempotent: yes — deduplicates against existing entities and submissions
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "ingestion-agent";
const DAILY_CAP = 20;
const RATE_LIMIT_MS = 1000;

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

/** Get date string for "one week ago" in YYYY-MM-DD format */
function getRecentDateCutoff(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

/** Curated sources for entity discovery */
const DISCOVERY_SOURCES = [
  {
    id: "github-trending",
    name: "GitHub Search — AI/ML Repos",
    url: `https://api.github.com/search/repositories?q=topic:machine-learning+topic:ai+created:>${getRecentDateCutoff()}&sort=stars&per_page=5`,
    entityType: "tool" as const,
    description: "Recently created AI/ML repositories on GitHub",
  },
  {
    id: "huggingface-models",
    name: "HuggingFace — New Models",
    url: "https://huggingface.co/api/models?sort=lastModified&direction=-1&limit=5",
    entityType: "model" as const,
    description: "Recently updated models on HuggingFace Hub",
  },
  {
    id: "arxiv-cs-ai",
    name: "arXiv — CS.AI",
    url: "http://export.arxiv.org/api/query?search_query=cat:cs.AI&sortBy=submittedDate&sortOrder=descending&max_results=5",
    entityType: "benchmark" as const,
    description: "Recent AI research papers and benchmarks",
  },
];

interface DiscoveryCandidate {
  sourceId: string;
  name: string;
  suggestedType: string;
  url: string;
  description: string;
}

/**
 * Infer entity type from GitHub repository topics.
 */
function inferTypeFromTopics(topics: string[]): string {
  const joined = topics.join(" ").toLowerCase();
  if (/\bagent\b/.test(joined)) return "agent";
  if (/\bmodel\b|\bllm\b|\btransformer\b/.test(joined)) return "model";
  if (/\bbenchmark\b|\bleaderboard\b|\beval\b/.test(joined)) return "benchmark";
  if (/\bskill\b|\bplugin\b/.test(joined)) return "skill";
  return "tool";
}

/**
 * Parse GitHub search API response into discovery candidates.
 */
function parseGitHubResponse(data: unknown, sourceId: string): DiscoveryCandidate[] {
  const candidates: DiscoveryCandidate[] = [];
  const body = data as { items?: Array<{
    name?: string;
    full_name?: string;
    description?: string;
    html_url?: string;
    topics?: string[];
  }> };

  if (!body.items || !Array.isArray(body.items)) return candidates;

  for (const repo of body.items) {
    candidates.push({
      sourceId,
      name: repo.full_name || repo.name || "unknown",
      suggestedType: inferTypeFromTopics(repo.topics || []),
      url: repo.html_url || "",
      description: repo.description || "",
    });
  }

  return candidates;
}

/**
 * Parse HuggingFace models API response into discovery candidates.
 */
function parseHuggingFaceResponse(data: unknown, sourceId: string): DiscoveryCandidate[] {
  const candidates: DiscoveryCandidate[] = [];
  const models = data as Array<{
    modelId?: string;
    tags?: string[];
    pipeline_tag?: string;
  }>;

  if (!Array.isArray(models)) return candidates;

  for (const model of models) {
    const id = model.modelId || "unknown";
    const pipelineTag = model.pipeline_tag || "general";
    const tags = model.tags || [];
    const tagStr = tags.slice(0, 5).join(", ");
    const desc = `HuggingFace model (${pipelineTag}). Tags: ${tagStr || "none"}`;

    candidates.push({
      sourceId,
      name: id,
      suggestedType: "model",
      url: `https://huggingface.co/${id}`,
      description: desc,
    });
  }

  return candidates;
}

/**
 * Parse arXiv Atom XML response into discovery candidates.
 * Uses simple regex-based parsing — no external XML library needed.
 */
function parseArxivResponse(xml: string, sourceId: string): DiscoveryCandidate[] {
  const candidates: DiscoveryCandidate[] = [];

  // Match each <entry> block
  const entryPattern = /<entry>([\s\S]*?)<\/entry>/g;
  let entryMatch: RegExpExecArray | null;

  while ((entryMatch = entryPattern.exec(xml)) !== null) {
    const entry = entryMatch[1];

    const titleMatch = entry.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const summaryMatch = entry.match(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const linkMatch = entry.match(/<id>([\s\S]*?)<\/id>/);

    const title = titleMatch
      ? titleMatch[1].replace(/\s+/g, " ").trim()
      : "Untitled";
    const summary = summaryMatch
      ? summaryMatch[1].replace(/\s+/g, " ").trim()
      : "";
    const url = linkMatch
      ? linkMatch[1].trim()
      : "";

    // Truncate summary to keep descriptions reasonable
    const truncatedSummary = summary.length > 300
      ? summary.slice(0, 297) + "..."
      : summary;

    candidates.push({
      sourceId,
      name: title,
      suggestedType: "benchmark",
      url,
      description: truncatedSummary,
    });
  }

  return candidates;
}

/**
 * Discover entities from a source by calling its real API endpoint.
 */
async function discoverFromSource(
  source: typeof DISCOVERY_SOURCES[number],
): Promise<DiscoveryCandidate[]> {
  console.log(`  Scanning: ${source.name} (${source.url})`);

  try {
    const headers: Record<string, string> = {
      "User-Agent": "AaaS-IngestionAgent/1.0",
    };

    // GitHub API requests benefit from an Accept header
    if (source.id === "github-trending") {
      headers["Accept"] = "application/vnd.github.v3+json";
    }

    const response = await fetch(source.url, { headers });

    if (!response.ok) {
      console.warn(
        `  [${source.id}] HTTP ${response.status}: ${response.statusText}`,
      );
      return [];
    }

    if (source.id === "github-trending") {
      const data = await response.json();
      return parseGitHubResponse(data, source.id);
    }

    if (source.id === "huggingface-models") {
      const data = await response.json();
      return parseHuggingFaceResponse(data, source.id);
    }

    if (source.id === "arxiv-cs-ai") {
      const xml = await response.text();
      return parseArxivResponse(xml, source.id);
    }

    console.warn(`  [${source.id}] Unknown source id, skipping parse`);
    return [];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`  [${source.id}] Fetch failed: ${message}`);
    return [];
  }
}

/**
 * Sleep helper for rate limiting between API calls.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a candidate already exists as an entity or pending submission.
 */
async function isDuplicate(candidate: DiscoveryCandidate): Promise<boolean> {
  // Check existing entities across all collections
  for (const collection of ENTITY_COLLECTIONS) {
    const existing = await db.collection(collection)
      .where("name", "==", candidate.name)
      .limit(1)
      .get();
    if (!existing.empty) {
      return true;
    }
  }

  // Check pending submissions
  const pendingSub = await db.collection("submissions")
    .where("entity.name", "==", candidate.name)
    .where("status", "==", "pending")
    .limit(1)
    .get();

  return !pendingSub.empty;
}

/**
 * Validate a candidate has minimum required data.
 */
function validateCandidate(candidate: DiscoveryCandidate): {
  valid: boolean;
  reason?: string;
} {
  if (!candidate.name || candidate.name.trim().length === 0) {
    return { valid: false, reason: "missing_name" };
  }
  if (!candidate.url || candidate.url.trim().length === 0) {
    return { valid: false, reason: "missing_url" };
  }
  if (!candidate.description || candidate.description.trim().length < 10) {
    return { valid: false, reason: "description_too_short" };
  }

  // Basic URL format validation
  try {
    new URL(candidate.url);
  } catch {
    return { valid: false, reason: "invalid_url" };
  }

  return { valid: true };
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting entity discovery...`);
  console.log(`[${AGENT_NAME}] Daily cap: ${DAILY_CAP} candidates`);

  let sourcesScanned = 0;
  let candidatesFound = 0;
  let duplicatesSkipped = 0;
  let invalidSkipped = 0;
  let submissionsCreated = 0;

  try {
    const allCandidates: DiscoveryCandidate[] = [];

    // Phase 1: Discover candidates from all sources
    for (const source of DISCOVERY_SOURCES) {
      sourcesScanned++;
      const candidates = await discoverFromSource(source);
      allCandidates.push(...candidates);

      // Rate limit: wait between source fetches
      if (sourcesScanned < DISCOVERY_SOURCES.length) {
        await sleep(RATE_LIMIT_MS);
      }
    }

    candidatesFound = allCandidates.length;

    // Apply daily cap
    const cappedCandidates = allCandidates.slice(0, DAILY_CAP);

    // Phase 2: Deduplicate and validate
    for (const candidate of cappedCandidates) {
      // Validate
      const validation = validateCandidate(candidate);
      if (!validation.valid) {
        console.log(
          `  Skipping "${candidate.name}": ${validation.reason}`,
        );
        invalidSkipped++;
        continue;
      }

      // Deduplicate
      const duplicate = await isDuplicate(candidate);
      if (duplicate) {
        console.log(`  Skipping "${candidate.name}": duplicate`);
        duplicatesSkipped++;
        continue;
      }

      // Phase 3: Create submission
      const now = new Date().toISOString();
      const submissionId = `auto-${Date.now()}-${candidate.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}`;

      await db.collection("submissions").doc(submissionId).set({
        entity: {
          name: candidate.name,
          type: candidate.suggestedType,
          description: candidate.description,
          url: candidate.url,
          provider: "[unverified]",
          version: "0.0.0",
          category: "uncategorized",
          tags: ["auto-discovered"],
          capabilities: [],
          integrations: [],
          useCases: [],
          pricingModel: "free",
          license: "",
          apiAvailable: false,
          apiDocsUrl: "",
          relatedTools: [],
          relatedModels: [],
          relatedAgents: [],
          relatedSkills: [],
          scores: {
            adoption: 0,
            quality: 0,
            freshness: 100,
            citations: 0,
            engagement: 0,
            composite: 0,
          },
          schemaCompleteness: 0,
        },
        submittedBy: AGENT_NAME,
        submittedAt: now,
        status: "pending",
        source: {
          id: candidate.sourceId,
          url: candidate.url,
        },
        autoDiscovered: true,
      });

      submissionsCreated++;
      console.log(
        `  Submitted: "${candidate.name}" (${candidate.suggestedType}) from ${candidate.sourceId}`,
      );
    }

    await logAgentAction(
      AGENT_NAME,
      "discovery_complete",
      {
        sourcesScanned,
        candidatesFound,
        duplicatesSkipped,
        invalidSkipped,
        submissionsCreated,
        dailyCap: DAILY_CAP,
      },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Discovery complete. ${sourcesScanned} sources scanned, ${candidatesFound} candidates found, ${submissionsCreated} submissions created.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "discovery_failed",
      { sourcesScanned, candidatesFound, submissionsCreated },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Discovery failed:`, message);
    throw err;
  }
}
