/**
 * Enrichment Agent
 *
 * Scans all entity collections for entities with placeholder or missing data
 * (fields containing "[unverified]" or empty strings) and attempts to enrich
 * them by fetching real information from public APIs:
 *
 * - Tools: npm registry + GitHub API (version, description, stars, topics)
 * - Models: HuggingFace API (parameters, tags, pipeline_tag)
 *
 * Uses native fetch() with rate limiting (max 10 API calls per run,
 * 1 second delay between calls).
 *
 * Schedule: daily (runs after schema-healer)
 * Idempotent: yes — only updates fields that are still placeholder/empty
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "enrichment-agent";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];
const MAX_API_CALLS = 10;
const DELAY_MS = 1000;

interface EntityRecord {
  collection: string;
  docId: string;
  data: Record<string, unknown>;
}

/** Sleep helper for rate limiting */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check if a string field is placeholder or empty */
function isPlaceholder(value: unknown): boolean {
  if (value === undefined || value === null || value === "") return true;
  if (typeof value === "string" && value.includes("[unverified]")) return true;
  return false;
}

/** Check if an array field is placeholder */
function isPlaceholderArray(value: unknown): boolean {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return true;
  if (value.length === 1 && value[0] === "unverified") return true;
  return false;
}

/** Check if an entity has any placeholder/empty fields worth enriching */
function needsEnrichment(data: Record<string, unknown>): boolean {
  const fieldsToCheck = ["name", "description", "provider", "version", "url", "tags", "capabilities"];
  for (const field of fieldsToCheck) {
    const val = data[field];
    if (isPlaceholder(val)) return true;
    if (Array.isArray(val) && isPlaceholderArray(val)) return true;
  }
  return false;
}

/**
 * Try to extract npm package name from entity data.
 * Looks at url, slug, or name fields for npm-like identifiers.
 */
function extractNpmPackage(data: Record<string, unknown>, docId: string): string | null {
  const url = data.url as string | undefined;
  if (url) {
    // Match https://www.npmjs.com/package/xxx or https://npmjs.com/package/xxx
    const npmMatch = url.match(/npmjs\.com\/package\/([^/?\s]+(?:\/[^/?\s]+)?)/);
    if (npmMatch) return npmMatch[1];
  }
  // Fall back to slug/docId
  return docId || null;
}

/**
 * Try to extract GitHub owner/repo from entity data.
 */
function extractGitHubRepo(data: Record<string, unknown>): { owner: string; repo: string } | null {
  const url = data.url as string | undefined;
  const repoUrl = data.repoUrl as string | undefined;
  const sourceUrl = data.sourceUrl as string | undefined;

  for (const candidate of [repoUrl, sourceUrl, url]) {
    if (candidate) {
      const match = candidate.match(/github\.com\/([^/\s]+)\/([^/?\s#]+)/);
      if (match) return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
    }
  }
  return null;
}

/**
 * Try to extract HuggingFace model ID from entity data.
 */
function extractHuggingFaceId(data: Record<string, unknown>, docId: string): string | null {
  const url = data.url as string | undefined;
  if (url) {
    const hfMatch = url.match(/huggingface\.co\/([^/\s]+\/[^/?\s#]+)/);
    if (hfMatch) return hfMatch[1];
  }
  // Check provider + name combo
  const provider = data.provider as string | undefined;
  const name = data.name as string | undefined;
  if (provider && name && !isPlaceholder(provider) && !isPlaceholder(name)) {
    return `${provider}/${name}`;
  }
  return docId.includes("/") ? docId : null;
}

/** Fetch data from npm registry */
async function fetchNpmData(packageName: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;
    const distTags = json["dist-tags"] as Record<string, string> | undefined;
    return {
      version: distTags?.latest ?? null,
      description: json.description ?? null,
      keywords: json.keywords ?? null,
    };
  } catch {
    return null;
  }
}

/** Fetch data from GitHub API */
async function fetchGitHubData(owner: string, repo: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { "Accept": "application/vnd.github.v3+json" },
    });
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;
    return {
      description: json.description ?? null,
      stars: json.stargazers_count ?? null,
      language: json.language ?? null,
      topics: json.topics ?? null,
    };
  } catch {
    return null;
  }
}

/** Fetch data from HuggingFace API */
async function fetchHuggingFaceData(modelId: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`https://huggingface.co/api/models/${modelId}`);
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;
    return {
      tags: json.tags ?? null,
      pipeline_tag: json.pipeline_tag ?? null,
      parameters: (json.safetensors as Record<string, unknown>)?.total ?? null,
    };
  } catch {
    return null;
  }
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting enrichment pass...`);

  let totalScanned = 0;
  let enriched = 0;
  let apiCalls = 0;
  const enrichedEntities: string[] = [];

  try {
    // Phase 1: Scan all collections for entities needing enrichment
    const candidates: EntityRecord[] = [];

    for (const collection of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collection).get();
      for (const doc of snapshot.docs) {
        totalScanned++;
        const data = doc.data();
        if (needsEnrichment(data)) {
          candidates.push({ collection, docId: doc.id, data });
        }
      }
    }

    console.log(`[${AGENT_NAME}] Found ${candidates.length} entities needing enrichment out of ${totalScanned} total.`);

    if (candidates.length === 0) {
      await logAgentAction(AGENT_NAME, "enrichment_pass", { totalScanned, enriched: 0, apiCalls: 0 }, true);
      return;
    }

    // Phase 2: Enrich each candidate (respecting rate limits)
    for (const entity of candidates) {
      if (apiCalls >= MAX_API_CALLS) {
        console.log(`[${AGENT_NAME}] Reached API call limit (${MAX_API_CALLS}). Stopping.`);
        break;
      }

      const updates: Record<string, unknown> = {};
      const sources: string[] = [];

      // --- Tools enrichment: npm + GitHub ---
      if (entity.collection === "tools") {
        // Try npm
        const npmPkg = extractNpmPackage(entity.data, entity.docId);
        if (npmPkg && apiCalls < MAX_API_CALLS) {
          await sleep(DELAY_MS);
          apiCalls++;
          console.log(`  Fetching npm data for "${npmPkg}"...`);
          const npmData = await fetchNpmData(npmPkg);

          if (npmData) {
            sources.push("npm");
            if (npmData.version && isPlaceholder(entity.data.version)) {
              updates.version = npmData.version;
            }
            if (npmData.description && isPlaceholder(entity.data.description)) {
              updates.description = npmData.description;
            }
            if (npmData.keywords && isPlaceholderArray(entity.data.tags)) {
              updates.tags = npmData.keywords;
            }
          }
        }

        // Try GitHub
        const ghRepo = extractGitHubRepo(entity.data);
        if (ghRepo && apiCalls < MAX_API_CALLS) {
          await sleep(DELAY_MS);
          apiCalls++;
          console.log(`  Fetching GitHub data for "${ghRepo.owner}/${ghRepo.repo}"...`);
          const ghData = await fetchGitHubData(ghRepo.owner, ghRepo.repo);

          if (ghData) {
            sources.push("github");
            if (ghData.description && isPlaceholder(entity.data.description) && !updates.description) {
              updates.description = ghData.description;
            }
            if (ghData.topics && isPlaceholderArray(entity.data.tags) && !updates.tags) {
              updates.tags = ghData.topics;
            }
            if (ghData.stars !== null) {
              updates["metadata.githubStars"] = ghData.stars;
            }
            if (ghData.language) {
              updates["metadata.language"] = ghData.language;
            }
          }
        }
      }

      // --- Models enrichment: HuggingFace ---
      if (entity.collection === "models") {
        const hfId = extractHuggingFaceId(entity.data, entity.docId);
        if (hfId && apiCalls < MAX_API_CALLS) {
          await sleep(DELAY_MS);
          apiCalls++;
          console.log(`  Fetching HuggingFace data for "${hfId}"...`);
          const hfData = await fetchHuggingFaceData(hfId);

          if (hfData) {
            sources.push("huggingface");
            if (hfData.tags && isPlaceholderArray(entity.data.tags)) {
              updates.tags = hfData.tags;
            }
            if (hfData.pipeline_tag && isPlaceholder(entity.data.category)) {
              updates.category = hfData.pipeline_tag;
            }
            if (hfData.parameters !== null) {
              updates["metadata.parameters"] = hfData.parameters;
            }
          }
        }
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        updates.lastVerified = new Date().toISOString();

        const entityRef = db.collection(entity.collection).doc(entity.docId);
        await entityRef.update(updates);
        enriched++;
        enrichedEntities.push(`${entity.collection}/${entity.docId}`);

        console.log(
          `  Enriched ${entity.collection}/${entity.docId}: ${Object.keys(updates).length} fields updated from [${sources.join(", ")}]`,
        );

        // Remove from healing_queue if present
        const healingQueueSnap = await db
          .collection("healing_queue")
          .where("entityCollection", "==", entity.collection)
          .where("entityId", "==", entity.docId)
          .get();

        for (const doc of healingQueueSnap.docs) {
          await doc.ref.delete();
          console.log(`  Removed ${entity.collection}/${entity.docId} from healing_queue`);
        }
      } else {
        console.log(`  No enrichment data found for ${entity.collection}/${entity.docId}`);
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "enrichment_pass",
      { totalScanned, enriched, apiCalls, enrichedEntities },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Enrichment complete. ${totalScanned} scanned, ${enriched} enriched, ${apiCalls} API calls made.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "enrichment_failed",
      { totalScanned, enriched, apiCalls },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Enrichment failed:`, message);
    throw err;
  }
}
