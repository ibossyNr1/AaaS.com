/**
 * Episode Seeder — generates sample episodes for development/demo.
 *
 * Usage: npx tsx src/seed/seed-episodes.ts
 *
 * Creates narration episodes for all existing entities, plus sample
 * digest and podcast episodes. Uses stub TTS (placeholder audio).
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

const TYPE_LABELS: Record<string, string> = {
  tool: "Tool", model: "Model", agent: "Agent",
  skill: "Skill", script: "Script", benchmark: "Benchmark",
};

const CHANNEL_NAMES: Record<string, string> = {
  llms: "LLMs", "ai-tools": "AI Tools & APIs", "ai-agents": "AI Agents",
  "computer-vision": "Computer Vision", "ai-code": "AI for Code",
  "ai-infrastructure": "AI Infrastructure", "speech-audio": "Speech & Audio AI",
};

const PLACEHOLDER_AUDIO = "https://storage.googleapis.com/aaas-platform.appspot.com/audio/placeholder.mp3";

function estimateDuration(wordCount: number): number {
  return Math.round((wordCount / 150) * 60);
}

async function seed() {
  console.log("Seeding episodes...\n");
  let count = 0;

  // Phase 1: Narration episodes for every entity
  for (const collection of ENTITY_COLLECTIONS) {
    const snapshot = await db.collection(collection).get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const slug = doc.id;
      const type = (data.type as string) || collection.slice(0, -1);
      const name = (data.name as string) || slug;
      const typeLabel = TYPE_LABELS[type] || "entity";

      const script = [
        `This is the AaaS Knowledge Index. Today we're looking at ${name}, a ${typeLabel.toLowerCase()}.`,
        data.description || "",
        `${name} is provided by ${data.provider || "Unknown"}, version ${data.version || "Unknown"}.`,
        `Composite score: ${data.scores?.composite || 0}. Adoption: ${data.scores?.adoption || 0}. Quality: ${data.scores?.quality || 0}.`,
        `For the full spec sheet, visit aaas.blog/${type}/${slug}.`,
      ].join(" ");

      const episodeId = `narration-${type}-${slug}`;
      const duration = estimateDuration(script.split(/\s+/).length);

      await db.collection("episodes").doc(episodeId).set({
        title: `${name} — Entity Overview`,
        description: `Audio overview of ${name}, a ${typeLabel.toLowerCase()} in the AaaS Knowledge Index.`,
        format: "narration",
        duration,
        audioUrl: PLACEHOLDER_AUDIO,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
        sourceRef: slug,
        sourceType: type,
        channel: data.category || null,
        tags: [type, ...(Array.isArray(data.tags) ? data.tags.slice(0, 3) : [])],
        playCount: Math.floor(Math.random() * 200),
        generatedBy: "seed",
        ttsProvider: "stub",
        transcript: script,
      });

      count++;
      console.log(`  [narration] ${collection}/${slug}: ${duration}s`);
    }
  }

  // Phase 2: Sample digest episodes
  const channels = Object.keys(CHANNEL_NAMES);
  for (const channel of channels.slice(0, 4)) {
    const episodeId = `digest-${channel}-${new Date().toISOString().split("T")[0]}`;
    const channelName = CHANNEL_NAMES[channel];

    await db.collection("episodes").doc(episodeId).set({
      title: `${channelName} Daily Digest`,
      description: `Daily roundup of trending entities in the ${channelName} channel.`,
      format: "digest",
      duration: estimateDuration(800),
      audioUrl: PLACEHOLDER_AUDIO,
      publishedAt: new Date().toISOString(),
      sourceRef: null,
      sourceType: null,
      channel,
      tags: ["digest", channel],
      playCount: Math.floor(Math.random() * 50),
      generatedBy: "seed",
      ttsProvider: "stub",
      transcript: `AaaS Knowledge Index — ${channelName} Daily Digest. Today we cover the latest trends...`,
    });

    count++;
    console.log(`  [digest] ${channel}`);
  }

  // Phase 3: Sample weekly podcast
  const podcastId = `podcast-weekly-${new Date().toISOString().split("T")[0]}`;
  await db.collection("episodes").doc(podcastId).set({
    title: `AaaS Weekly — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    description: "Weekly roundup of the AI ecosystem's top trending entities, new additions, and key developments.",
    format: "podcast",
    duration: estimateDuration(2500),
    audioUrl: PLACEHOLDER_AUDIO,
    publishedAt: new Date().toISOString(),
    sourceRef: null,
    sourceType: null,
    channel: null,
    tags: ["podcast", "weekly"],
    playCount: Math.floor(Math.random() * 300),
    generatedBy: "seed",
    ttsProvider: "stub",
    transcript: "Welcome to the AaaS Knowledge Index Weekly. This week we cover the latest trends across tools, models, agents, and more...",
  });
  count++;
  console.log(`  [podcast] weekly`);

  console.log(`\nDone. ${count} episodes seeded.`);
}

seed().catch(console.error);
