/**
 * Media Agent
 *
 * Generates audio episodes for entities that don't have one yet.
 * Supports three episode formats:
 *   - Narration: 2-3 min overview of a single entity
 *   - Digest: 5-10 min daily channel summary
 *   - Podcast: 15-20 min weekly two-host discussion
 *
 * Uses real TTS when GOOGLE_APPLICATION_CREDENTIALS or ELEVENLABS_API_KEY
 * is set; falls back to stub (placeholder audio) otherwise.
 *
 * Schedule: daily (runs after new entities are ingested)
 * Idempotent: yes — only creates episodes for entities that don't have one
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "media-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

const ENTITY_TYPE_LABELS: Record<string, string> = {
  tool: "Tool",
  model: "Model",
  agent: "Agent",
  skill: "Skill",
  script: "Script",
  benchmark: "Benchmark",
};

const CHANNEL_NAMES: Record<string, string> = {
  llms: "LLMs",
  "ai-tools": "AI Tools & APIs",
  "ai-agents": "AI Agents",
  "computer-vision": "Computer Vision",
  "prompt-engineering": "Prompt Engineering",
  "ai-infrastructure": "AI Infrastructure",
  "ai-safety": "AI Ethics & Safety",
  "ai-business": "AI Business & Strategy",
  "ai-code": "AI for Code",
  "speech-audio": "Speech & Audio AI",
};

// ─── TTS Provider (auto-detect) ─────────────────────────────────────

interface TTSResult {
  audioUrl: string;
  duration: number;
  provider: string;
}

async function synthesize(text: string, voice?: string): Promise<TTSResult> {
  // Try Google Cloud TTS
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const { TextToSpeechClient } = await import("@google-cloud/text-to-speech");
      const { getStorage } = await import("firebase-admin/storage");

      const client = new TextToSpeechClient();
      const chunks = splitText(text, 4500);
      const audioBuffers: Buffer[] = [];

      for (const chunk of chunks) {
        const [response] = await client.synthesizeSpeech({
          input: { text: chunk },
          voice: { languageCode: "en-US", name: voice || "en-US-Neural2-D" },
          audioConfig: { audioEncoding: "MP3", speakingRate: 1.0 },
        });
        if (response.audioContent) {
          audioBuffers.push(Buffer.from(response.audioContent as Uint8Array));
        }
      }

      const fullAudio = Buffer.concat(audioBuffers);
      const filename = `audio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
      const bucket = getStorage().bucket("aaas-platform.appspot.com");
      const file = bucket.file(filename);

      await file.save(fullAudio, {
        metadata: { contentType: "audio/mpeg" },
      });
      await file.makePublic();

      return {
        audioUrl: `https://storage.googleapis.com/aaas-platform.appspot.com/${filename}`,
        duration: Math.round(fullAudio.length / 2000),
        provider: "google-cloud",
      };
    } catch (err) {
      console.warn(`[${AGENT_NAME}] Google TTS failed, falling back to stub:`, err);
    }
  }

  // Try ElevenLabs
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const { getStorage } = await import("firebase-admin/storage");
      const voiceId = voice || "21m00Tcm4TlvDq8ikWAM";

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": process.env.ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text.slice(0, 5000),
            model_id: "eleven_monolingual_v1",
            voice_settings: { stability: 0.5, similarity_boost: 0.75 },
          }),
        },
      );

      if (response.ok) {
        const audioBuffer = Buffer.from(await response.arrayBuffer());
        const filename = `audio/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp3`;
        const bucket = getStorage().bucket("aaas-platform.appspot.com");
        const file = bucket.file(filename);

        await file.save(audioBuffer, {
          metadata: { contentType: "audio/mpeg" },
        });
        await file.makePublic();

        return {
          audioUrl: `https://storage.googleapis.com/aaas-platform.appspot.com/${filename}`,
          duration: Math.round(audioBuffer.length / 2000),
          provider: "elevenlabs",
        };
      }
    } catch (err) {
      console.warn(`[${AGENT_NAME}] ElevenLabs TTS failed, falling back to stub:`, err);
    }
  }

  // Stub fallback
  const wordCount = text.split(/\s+/).length;
  return {
    audioUrl: "https://storage.googleapis.com/aaas-platform.appspot.com/audio/placeholder.mp3",
    duration: Math.round((wordCount / 150) * 60),
    provider: "stub",
  };
}

function splitText(text: string, maxBytes: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let current = "";
  for (const sentence of sentences) {
    if (Buffer.byteLength(current + " " + sentence) > maxBytes) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

// ─── Script Generators ──────────────────────────────────────────────

function generateNarrationScript(entity: Record<string, unknown>): string {
  const typeLabel = ENTITY_TYPE_LABELS[(entity.type as string) || ""] || "entity";
  const name = (entity.name as string) || "Unknown";
  const description = (entity.description as string) || "";
  const provider = (entity.provider as string) || "Unknown";
  const version = (entity.version as string) || "Unknown";
  const pricingModel = (entity.pricingModel as string) || "Unknown";
  const category = (entity.category as string) || "";
  const slug = (entity.slug as string) || "";
  const type = (entity.type as string) || "";
  const capabilities = (entity.capabilities as string[]) || [];
  const integrations = (entity.integrations as string[]) || [];
  const useCases = (entity.useCases as string[]) || [];
  const scores = (entity.scores as Record<string, number>) || {};

  const lines: string[] = [
    `This is the AaaS Knowledge Index. Today we're looking at ${name}, a ${typeLabel.toLowerCase()} in the ${CHANNEL_NAMES[category] || category} channel.`,
    "", description, "",
    `${name} is provided by ${provider}, currently at version ${version}, with a ${pricingModel} pricing model.`,
  ];

  if (capabilities.length > 0) lines.push("", `Key capabilities include: ${capabilities.slice(0, 5).join(", ")}.`);
  if (integrations.length > 0) lines.push(`It integrates with ${integrations.slice(0, 4).join(", ")}.`);
  if (useCases.length > 0) lines.push("", `Common use cases: ${useCases.slice(0, 4).join(", ")}.`);

  lines.push(
    "",
    `In the Knowledge Index, ${name} has a composite score of ${scores.composite || 0}, with an adoption score of ${scores.adoption || 0} and a quality score of ${scores.quality || 0}.`,
    "",
    `That's ${name} on the AaaS Knowledge Index. For the full spec sheet, visit aaas.blog/${type}/${slug}.`,
  );

  return lines.join("\n");
}

function generateDigestScript(channel: string, entities: Array<Record<string, unknown>>): string {
  const channelName = CHANNEL_NAMES[channel] || channel;
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const lines: string[] = [
    `AaaS Knowledge Index — ${channelName} Daily Digest for ${date}.`,
    "",
    `Today we have ${entities.length} ${entities.length === 1 ? "update" : "updates"} in the ${channelName} channel.`,
    "",
  ];

  entities.forEach((entity, i) => {
    const typeLabel = ENTITY_TYPE_LABELS[(entity.type as string) || ""] || "entity";
    lines.push(
      `Number ${i + 1}: ${entity.name}, a ${typeLabel.toLowerCase()} by ${entity.provider}.`,
      (entity.description as string) || "",
      `Composite score: ${(entity.scores as Record<string, number>)?.composite || 0}.`,
      "",
    );
  });

  lines.push(`That wraps up today's ${channelName} digest. Visit aaas.blog for the full index.`);
  return lines.join("\n");
}

function generatePodcastScript(entities: Array<Record<string, unknown>>): string {
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const lines: string[] = [
    `Welcome to the AaaS Knowledge Index Weekly, your podcast for the AI ecosystem. This is our roundup for the week of ${date}.`,
    "",
    `We've got ${entities.length} trending entities to cover this week. Let's dive in.`,
    "",
  ];

  for (const entity of entities.slice(0, 10)) {
    const typeLabel = ENTITY_TYPE_LABELS[(entity.type as string) || ""] || "entity";
    const scores = (entity.scores as Record<string, number>) || {};
    lines.push(
      `Next up: ${entity.name}, a ${typeLabel.toLowerCase()} by ${entity.provider}. It's sitting at a composite score of ${scores.composite || 0}.`,
      (entity.description as string) || "",
      "",
    );
  }

  lines.push(
    `That's our weekly roundup. You can find the full specs for everything we discussed at aaas.blog.`,
    `Subscribe via the Vault at agents-as-a-service.com to get these updates delivered. Until next week.`,
  );
  return lines.join("\n");
}

// ─── Main Run ───────────────────────────────────────────────────────

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting media generation pass...`);

  let totalEntities = 0;
  let newNarrations = 0;
  let newDigests = 0;
  let newPodcasts = 0;

  try {
    // Load existing episodes
    const episodesSnap = await db.collection("episodes").get();
    const existingNarrations = new Set<string>();
    const existingDigests = new Set<string>();
    let hasWeeklyPodcast = false;

    const weekStart = getWeekStart();

    for (const doc of episodesSnap.docs) {
      const data = doc.data();
      if (data.format === "narration" && data.sourceRef) {
        existingNarrations.add(data.sourceRef);
      }
      if (data.format === "digest" && data.channel) {
        const digestDate = data.publishedAt?.split("T")[0];
        const today = new Date().toISOString().split("T")[0];
        if (digestDate === today) existingDigests.add(data.channel);
      }
      if (data.format === "podcast") {
        const pubDate = data.publishedAt?.split("T")[0];
        if (pubDate && pubDate >= weekStart) hasWeeklyPodcast = true;
      }
    }

    console.log(`[${AGENT_NAME}] Existing: ${existingNarrations.size} narrations, ${existingDigests.size} today's digests, weekly podcast: ${hasWeeklyPodcast}`);

    // ─── Phase 1: Narrations for entities without episodes ─────────
    for (const collectionName of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collectionName).get();

      for (const doc of snapshot.docs) {
        totalEntities++;
        const data = doc.data();
        const slug = doc.id;

        if (existingNarrations.has(slug)) continue;

        const script = generateNarrationScript({ ...data, slug });
        const result = await synthesize(script);

        const episodeId = `narration-${data.type || collectionName.slice(0, -1)}-${slug}`;
        await db.collection("episodes").doc(episodeId).set({
          title: `${data.name || slug} — Entity Overview`,
          description: `Audio overview of ${data.name || slug}, a ${ENTITY_TYPE_LABELS[data.type] || "entity"} in the AaaS Knowledge Index.`,
          format: "narration",
          duration: result.duration,
          audioUrl: result.audioUrl,
          publishedAt: new Date().toISOString(),
          sourceRef: slug,
          sourceType: data.type || collectionName.slice(0, -1),
          channel: data.category || null,
          tags: [data.type || collectionName.slice(0, -1), ...(Array.isArray(data.tags) ? data.tags.slice(0, 3) : [])],
          playCount: 0,
          generatedBy: AGENT_NAME,
          ttsProvider: result.provider,
          transcript: script,
        });

        newNarrations++;
        console.log(`  [narration] ${collectionName}/${slug}: ${result.duration}s (${result.provider})`);
      }
    }

    // ─── Phase 2: Daily channel digests ────────────────────────────
    const channelEntities = new Map<string, Array<Record<string, unknown>>>();

    for (const collectionName of ENTITY_COLLECTIONS) {
      const snapshot = await db.collection(collectionName)
        .orderBy("scores.composite", "desc")
        .limit(5)
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const channel = data.category as string;
        if (!channel) continue;
        const list = channelEntities.get(channel) || [];
        list.push({ ...data, slug: doc.id });
        channelEntities.set(channel, list);
      }
    }

    for (const [channel, entities] of channelEntities) {
      if (existingDigests.has(channel)) continue;
      if (entities.length < 2) continue;

      const script = generateDigestScript(channel, entities.slice(0, 5));
      const result = await synthesize(script);
      const today = new Date().toISOString().split("T")[0];
      const episodeId = `digest-${channel}-${today}`;

      await db.collection("episodes").doc(episodeId).set({
        title: `${CHANNEL_NAMES[channel] || channel} Daily Digest`,
        description: `Daily roundup of ${entities.length} trending entities in the ${CHANNEL_NAMES[channel] || channel} channel.`,
        format: "digest",
        duration: result.duration,
        audioUrl: result.audioUrl,
        publishedAt: new Date().toISOString(),
        sourceRef: null,
        sourceType: null,
        channel,
        tags: ["digest", channel],
        playCount: 0,
        generatedBy: AGENT_NAME,
        ttsProvider: result.provider,
        transcript: script,
      });

      newDigests++;
      console.log(`  [digest] ${channel}: ${result.duration}s (${result.provider})`);
    }

    // ─── Phase 3: Weekly podcast ──────────────────────────────────
    if (!hasWeeklyPodcast) {
      const allTrending: Array<Record<string, unknown>> = [];
      for (const collectionName of ENTITY_COLLECTIONS) {
        const snapshot = await db.collection(collectionName)
          .orderBy("scores.composite", "desc")
          .limit(3)
          .get();
        for (const doc of snapshot.docs) {
          allTrending.push({ ...doc.data(), slug: doc.id });
        }
      }

      if (allTrending.length >= 3) {
        allTrending.sort((a, b) =>
          ((b.scores as Record<string, number>)?.composite || 0) -
          ((a.scores as Record<string, number>)?.composite || 0),
        );

        const script = generatePodcastScript(allTrending.slice(0, 10));
        const result = await synthesize(script);
        const episodeId = `podcast-weekly-${weekStart}`;

        await db.collection("episodes").doc(episodeId).set({
          title: `AaaS Weekly — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
          description: `Weekly roundup of ${allTrending.length} trending AI ecosystem entities.`,
          format: "podcast",
          duration: result.duration,
          audioUrl: result.audioUrl,
          publishedAt: new Date().toISOString(),
          sourceRef: null,
          sourceType: null,
          channel: null,
          tags: ["podcast", "weekly"],
          playCount: 0,
          generatedBy: AGENT_NAME,
          ttsProvider: result.provider,
          transcript: script,
        });

        newPodcasts++;
        console.log(`  [podcast] Weekly: ${result.duration}s (${result.provider})`);
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "media_generation_complete",
      { totalEntities, newNarrations, newDigests, newPodcasts },
      true,
    );

    console.log(
      `[${AGENT_NAME}] Media generation complete. ${totalEntities} entities, ${newNarrations} narrations, ${newDigests} digests, ${newPodcasts} podcasts created.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "media_generation_failed",
      { totalEntities, newNarrations, newDigests, newPodcasts },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Media generation failed:`, message);
    throw err;
  }
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}
