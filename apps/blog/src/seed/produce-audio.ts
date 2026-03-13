/**
 * Produce Audio — Generates real TTS audio for all seed episodes.
 *
 * Uses Google Cloud TTS to synthesize narration scripts, uploads to
 * Firebase Storage, and writes episode records to Firestore with real audio URLs.
 *
 * Usage:
 *   npx tsx src/seed/produce-audio.ts
 *
 * Environment:
 *   - GOOGLE_APPLICATION_CREDENTIALS or Application Default Credentials
 *   - Firebase Admin auto-initializes with projectId "aaas-platform"
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { GoogleCloudTTSProvider } from "../lib/tts";
import { seedEntities } from "./seed-data";
import {
  entityNarrationScript,
  channelDigestScript,
  weeklyTrendScript,
} from "../lib/narration-templates";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();
const tts = new GoogleCloudTTSProvider("aaas-platform-audio");

const TODAY = new Date().toISOString().split("T")[0];
const NOW = new Date().toISOString();

// Different voices for variety
const VOICES = {
  narration: "en-US-Neural2-D",    // Male, authoritative
  digest: "en-US-Neural2-F",       // Female, clear
  podcast: "en-US-Neural2-J",      // Male, conversational
};

async function produceAudio() {
  console.log("═══ PRODUCE AUDIO: Generating real TTS content ═══\n");
  let episodeCount = 0;
  let totalDuration = 0;

  // ─── Phase 1: Entity Narrations ────────────────────────────────────
  console.log("Phase 1: Entity Narrations (Google Cloud TTS)\n");

  for (const entity of seedEntities) {
    const script = entityNarrationScript(entity as unknown as Record<string, unknown>);
    const episodeId = `narration-${entity.type}-${entity.slug}`;

    console.log(`  Synthesizing: ${entity.name} (${entity.type})...`);

    try {
      const result = await tts.synthesize(script, { voice: VOICES.narration });

      await db.collection("episodes").doc(episodeId).set({
        title: `${entity.name} — Entity Overview`,
        description: `Audio overview of ${entity.name}, a ${entity.type} in the AaaS Knowledge Index. Covers capabilities, provider, scores, and key details.`,
        format: "narration",
        duration: result.duration,
        audioUrl: result.audioUrl,
        publishedAt: new Date(Date.now() - Math.random() * 3 * 86400000).toISOString(),
        sourceRef: entity.slug,
        sourceType: entity.type,
        channel: entity.category,
        tags: [entity.type, ...entity.tags.slice(0, 3)],
        playCount: Math.floor(Math.random() * 150 + 10),
        generatedBy: "produce-audio",
        ttsProvider: "google-cloud",
        ttsVoice: VOICES.narration,
        transcript: script,
      });

      console.log(`  ✓ ${entity.name} — ${result.duration}s — ${result.audioUrl}`);
      episodeCount++;
      totalDuration += result.duration;
    } catch (err) {
      console.error(`  ✗ ${entity.name} failed:`, err);
    }
  }

  // ─── Phase 2: Channel Digests ──────────────────────────────────────
  console.log("\nPhase 2: Channel Digests\n");

  const channelGroups: Record<string, typeof seedEntities> = {};
  for (const entity of seedEntities) {
    const ch = entity.category;
    if (!channelGroups[ch]) channelGroups[ch] = [];
    channelGroups[ch].push(entity);
  }

  const channelNames: Record<string, string> = {
    llms: "LLMs",
    "ai-tools": "AI Tools & APIs",
    "ai-agents": "AI Agents",
    "ai-code": "AI for Code",
    "ai-infrastructure": "AI Infrastructure",
  };

  for (const [channel, entities] of Object.entries(channelGroups)) {
    const script = channelDigestScript(channel, entities as unknown as Array<Record<string, unknown>>);
    const episodeId = `digest-${channel}-${TODAY}`;
    const chName = channelNames[channel] || channel;

    console.log(`  Synthesizing: ${chName} digest (${entities.length} entities)...`);

    try {
      const result = await tts.synthesize(script, { voice: VOICES.digest });

      await db.collection("episodes").doc(episodeId).set({
        title: `${chName} Daily Digest — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
        description: `Daily roundup covering ${entities.length} entities in the ${chName} channel.`,
        format: "digest",
        duration: result.duration,
        audioUrl: result.audioUrl,
        publishedAt: NOW,
        sourceRef: null,
        sourceType: null,
        channel,
        tags: ["digest", channel],
        playCount: Math.floor(Math.random() * 30 + 5),
        generatedBy: "produce-audio",
        ttsProvider: "google-cloud",
        ttsVoice: VOICES.digest,
        transcript: script,
      });

      console.log(`  ✓ ${chName} — ${result.duration}s — ${result.audioUrl}`);
      episodeCount++;
      totalDuration += result.duration;
    } catch (err) {
      console.error(`  ✗ ${chName} digest failed:`, err);
    }
  }

  // ─── Phase 3: Weekly Podcast ───────────────────────────────────────
  console.log("\nPhase 3: Weekly Podcast (Inaugural)\n");

  const sortedEntities = [...seedEntities].sort(
    (a, b) => (b.scores.composite || 0) - (a.scores.composite || 0),
  );
  const weeklyScript = weeklyTrendScript(sortedEntities as unknown as Array<Record<string, unknown>>);
  const podcastId = `podcast-weekly-${TODAY}`;

  console.log("  Synthesizing: Inaugural weekly podcast...");

  try {
    const result = await tts.synthesize(weeklyScript, {
      voice: VOICES.podcast,
      speed: 0.95, // Slightly slower for podcast feel
    });

    await db.collection("episodes").doc(podcastId).set({
      title: `AaaS Weekly — Inaugural Edition — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      description: "The inaugural weekly podcast from the AaaS Knowledge Index. Covering the first batch of indexed entities across the AI ecosystem.",
      format: "podcast",
      duration: result.duration,
      audioUrl: result.audioUrl,
      publishedAt: NOW,
      sourceRef: null,
      sourceType: null,
      channel: null,
      tags: ["podcast", "weekly", "inaugural"],
      playCount: Math.floor(Math.random() * 50 + 20),
      generatedBy: "produce-audio",
      ttsProvider: "google-cloud",
      ttsVoice: VOICES.podcast,
      transcript: weeklyScript,
    });

    console.log(`  ✓ Weekly Podcast — ${result.duration}s — ${result.audioUrl}`);
    episodeCount++;
    totalDuration += result.duration;
  } catch (err) {
    console.error("  ✗ Weekly podcast failed:", err);
  }

  // ─── Summary ───────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  Episodes produced:   ${episodeCount}`);
  console.log(`  Total audio:         ${Math.round(totalDuration / 60)} min ${totalDuration % 60}s`);
  console.log(`  TTS provider:        Google Cloud Neural2`);
  console.log(`  Storage:             Firebase Storage (aaas-platform)`);
  console.log("═══════════════════════════════════════════════════");
  console.log("\nAudio is live.");
  console.log("  → Listen page:  https://aaas.blog/listen");
  console.log("  → Podcast feed: https://aaas.blog/api/podcast/feed");
}

produceAudio().catch(console.error);
