/**
 * Categorization Agent
 *
 * Analyzes entity descriptions, capabilities, and tags to verify and suggest
 * channel assignment updates. Uses keyword matching against the 10 AaaS
 * Knowledge Index channels to score each entity.
 *
 * If the best-matching channel differs from the current category AND its score
 * is >3x the current channel's score, a suggestion is written to the
 * `categorization_suggestions` Firestore collection for human review.
 *
 * This agent does NOT auto-update categories — changes are too impactful
 * and require human judgment.
 *
 * Schedule: daily (runs after ranking-agent)
 * Idempotent: yes — overwrites existing suggestions for the same entity
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "categorization-agent";
const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

/** Keyword maps for each of the 10 channels */
const CHANNEL_KEYWORDS: Record<string, string[]> = {
  "llms": [
    "language model", "llm", "gpt", "claude", "transformer",
    "fine-tun", "inference", "rag",
  ],
  "ai-tools": [
    "sdk", "api", "developer tool", "framework", "library", "cli",
  ],
  "ai-agents": [
    "agent", "autonomous", "multi-agent", "assistant", "agentic",
  ],
  "computer-vision": [
    "image", "vision", "object detection", "segmentation", "ocr",
  ],
  "prompt-engineering": [
    "prompt", "context engineering", "chain of thought", "few-shot",
  ],
  "ai-infrastructure": [
    "mlops", "pipeline", "deployment", "kubernetes", "training", "gpu",
  ],
  "ai-safety": [
    "alignment", "safety", "bias", "governance", "responsible", "ethics",
  ],
  "ai-business": [
    "enterprise", "roi", "adoption", "strategy", "market",
  ],
  "ai-code": [
    "code generation", "coding", "ide", "copilot", "debugging", "code review",
  ],
  "speech-audio": [
    "speech", "tts", "stt", "voice", "audio", "transcription",
  ],
};

interface ChannelScore {
  channel: string;
  score: number;
}

/**
 * Build a searchable text corpus from an entity's relevant fields.
 * Lowercased for case-insensitive matching.
 */
function buildCorpus(data: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof data.name === "string") parts.push(data.name);
  if (typeof data.description === "string") parts.push(data.description);

  if (Array.isArray(data.capabilities)) {
    for (const cap of data.capabilities) {
      if (typeof cap === "string") parts.push(cap);
    }
  }

  if (Array.isArray(data.tags)) {
    for (const tag of data.tags) {
      if (typeof tag === "string") parts.push(tag);
    }
  }

  return parts.join(" ").toLowerCase();
}

/**
 * Score an entity's text corpus against all channels.
 * Returns scores sorted descending.
 */
function scoreChannels(corpus: string): ChannelScore[] {
  const scores: ChannelScore[] = [];

  for (const [channel, keywords] of Object.entries(CHANNEL_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      // Count all occurrences of the keyword in the corpus
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = corpus.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    scores.push({ channel, score });
  }

  // Sort descending by score
  scores.sort((a, b) => b.score - a.score);
  return scores;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting categorization analysis...`);

  let totalScanned = 0;
  let suggestionsCreated = 0;
  let confirmedCorrect = 0;

  try {
    for (const collection of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collection).get();

      for (const doc of snapshot.docs) {
        totalScanned++;
        const data = doc.data();
        const currentCategory = (data.category as string) || "uncategorized";
        const corpus = buildCorpus(data);

        // Skip entities with no meaningful text to analyze
        if (corpus.trim().length < 10) {
          console.log(`  Skipping ${collection}/${doc.id} — insufficient text for analysis`);
          continue;
        }

        const scores = scoreChannels(corpus);
        const bestMatch = scores[0];

        // Find current category's score
        const currentScore = scores.find((s) => s.channel === currentCategory)?.score ?? 0;

        // Log what we found
        const topThree = scores
          .filter((s) => s.score > 0)
          .slice(0, 3)
          .map((s) => `${s.channel}(${s.score})`)
          .join(", ");

        if (bestMatch.score === 0) {
          console.log(`  ${collection}/${doc.id}: no keyword matches found`);
          continue;
        }

        // Check if recategorization is warranted:
        // Best match must differ from current AND score must be >3x current channel's score
        if (
          bestMatch.channel !== currentCategory &&
          bestMatch.score > 0 &&
          (currentScore === 0 || bestMatch.score > currentScore * 3)
        ) {
          // Write suggestion to Firestore
          const suggestionId = `${collection}_${doc.id}`;
          await db.collection("categorization_suggestions").doc(suggestionId).set({
            entityCollection: collection,
            entityId: doc.id,
            entityName: data.name || doc.id,
            currentCategory,
            suggestedCategory: bestMatch.channel,
            currentScore,
            suggestedScore: bestMatch.score,
            allScores: scores.filter((s) => s.score > 0),
            createdAt: new Date().toISOString(),
            status: "pending",
          });

          suggestionsCreated++;
          console.log(
            `  ${collection}/${doc.id}: suggest "${currentCategory}" -> "${bestMatch.channel}" ` +
            `(score ${bestMatch.score} vs ${currentScore}) | top: ${topThree}`,
          );
        } else {
          confirmedCorrect++;
          if (topThree) {
            console.log(
              `  ${collection}/${doc.id}: "${currentCategory}" confirmed | top: ${topThree}`,
            );
          }
        }
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "categorization_pass",
      { totalScanned, suggestionsCreated, confirmedCorrect },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Categorization complete. ${totalScanned} scanned, ` +
      `${suggestionsCreated} suggestions created, ${confirmedCorrect} confirmed correct.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "categorization_failed",
      { totalScanned, suggestionsCreated },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Categorization failed:`, message);
    throw err;
  }
}
