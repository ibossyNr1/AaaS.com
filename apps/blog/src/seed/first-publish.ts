/**
 * First Publish — Generates the inaugural batch of podcast episodes and video manifests.
 *
 * This script creates production-ready content for the initial launch:
 *   - 11 entity narration episodes (one per seed entity)
 *   - 4 channel digest episodes (LLMs, AI Tools, AI Agents, AI Code)
 *   - 1 weekly podcast episode (inaugural launch)
 *   - 11 entity spotlight video manifests
 *   - 2 daily roundup video manifests
 *
 * Usage:
 *   npx tsx src/seed/first-publish.ts
 *
 * Environment:
 *   - Requires Firebase Admin (uses emulator or service account)
 *   - Set GOOGLE_APPLICATION_CREDENTIALS for production Firestore
 *   - Set TTS_PROVIDER or ELEVENLABS_API_KEY for real audio generation
 *   - Falls back to stub TTS if no provider configured
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { seedEntities } from "./seed-data";
import { entityNarrationScript, channelDigestScript, weeklyTrendScript } from "../lib/narration-templates";
import { entitySpotlightTemplate, dailyRoundupTemplate } from "../lib/video-templates";
import type { EntitySpotlightData } from "../lib/video-templates";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

const PLACEHOLDER_AUDIO = "https://storage.googleapis.com/aaas-platform.appspot.com/audio/placeholder.mp3";
const TODAY = new Date().toISOString().split("T")[0];
const NOW = new Date().toISOString();

function estimateDuration(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.round((words / 150) * 60);
}

function gradeFromScore(score: number): string {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

async function publishEpisodes() {
  console.log("═══ FIRST PUBLISH: Generating inaugural content ═══\n");
  let episodeCount = 0;
  let videoCount = 0;

  // ─── Phase 1: Entity Narrations ────────────────────────────────────
  console.log("Phase 1: Entity Narrations");
  for (const entity of seedEntities) {
    const script = entityNarrationScript(entity as unknown as Record<string, unknown>);
    const duration = estimateDuration(script);
    const episodeId = `narration-${entity.type}-${entity.slug}`;

    await db.collection("episodes").doc(episodeId).set({
      title: `${entity.name} — Entity Overview`,
      description: `Audio overview of ${entity.name}, a ${entity.type} in the AaaS Knowledge Index. Covers capabilities, provider, scores, and key details.`,
      format: "narration",
      duration,
      audioUrl: PLACEHOLDER_AUDIO,
      publishedAt: new Date(Date.now() - Math.random() * 3 * 86400000).toISOString(),
      sourceRef: entity.slug,
      sourceType: entity.type,
      channel: entity.category,
      tags: [entity.type, ...entity.tags.slice(0, 3)],
      playCount: Math.floor(Math.random() * 150 + 10),
      generatedBy: "first-publish",
      ttsProvider: "stub",
      transcript: script,
    });

    console.log(`  ✓ [narration] ${entity.name} (${entity.type}) — ${duration}s`);
    episodeCount++;
  }

  // ─── Phase 2: Channel Digests ──────────────────────────────────────
  console.log("\nPhase 2: Channel Digests");
  const channelGroups: Record<string, typeof seedEntities> = {};
  for (const entity of seedEntities) {
    const ch = entity.category;
    if (!channelGroups[ch]) channelGroups[ch] = [];
    channelGroups[ch].push(entity);
  }

  const channelNames: Record<string, string> = {
    llms: "LLMs", "ai-tools": "AI Tools & APIs", "ai-agents": "AI Agents",
    "ai-code": "AI for Code", "ai-infrastructure": "AI Infrastructure",
  };

  for (const [channel, entities] of Object.entries(channelGroups)) {
    const script = channelDigestScript(channel, entities as unknown as Array<Record<string, unknown>>);
    const duration = estimateDuration(script);
    const episodeId = `digest-${channel}-${TODAY}`;
    const chName = channelNames[channel] || channel;

    await db.collection("episodes").doc(episodeId).set({
      title: `${chName} Daily Digest — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
      description: `Daily roundup covering ${entities.length} entities in the ${chName} channel.`,
      format: "digest",
      duration,
      audioUrl: PLACEHOLDER_AUDIO,
      publishedAt: NOW,
      sourceRef: null,
      sourceType: null,
      channel,
      tags: ["digest", channel],
      playCount: Math.floor(Math.random() * 30 + 5),
      generatedBy: "first-publish",
      ttsProvider: "stub",
      transcript: script,
    });

    console.log(`  ✓ [digest] ${chName} — ${entities.length} entities, ${duration}s`);
    episodeCount++;
  }

  // ─── Phase 3: Weekly Podcast ───────────────────────────────────────
  console.log("\nPhase 3: Weekly Podcast (Inaugural)");
  const sortedEntities = [...seedEntities].sort(
    (a, b) => (b.scores.composite || 0) - (a.scores.composite || 0),
  );
  const weeklyScript = weeklyTrendScript(sortedEntities as unknown as Array<Record<string, unknown>>);
  const weeklyDuration = estimateDuration(weeklyScript);
  const podcastId = `podcast-weekly-${TODAY}`;

  await db.collection("episodes").doc(podcastId).set({
    title: `AaaS Weekly — Inaugural Edition — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    description: "The inaugural weekly podcast from the AaaS Knowledge Index. Covering the first batch of indexed entities across the AI ecosystem — top movers, new additions, and the landscape.",
    format: "podcast",
    duration: weeklyDuration,
    audioUrl: PLACEHOLDER_AUDIO,
    publishedAt: NOW,
    sourceRef: null,
    sourceType: null,
    channel: null,
    tags: ["podcast", "weekly", "inaugural"],
    playCount: Math.floor(Math.random() * 50 + 20),
    generatedBy: "first-publish",
    ttsProvider: "stub",
    transcript: weeklyScript,
  });

  console.log(`  ✓ [podcast] Inaugural Weekly — ${weeklyDuration}s`);
  episodeCount++;

  // ─── Phase 4: Video Manifests ──────────────────────────────────────
  console.log("\nPhase 4: Video Manifests");

  // Entity spotlights
  for (const entity of seedEntities) {
    const spotlightData: EntitySpotlightData = {
      name: entity.name,
      type: entity.type,
      provider: entity.provider,
      description: entity.description,
      composite: entity.scores.composite || 0,
      grade: gradeFromScore(entity.scores.composite || 0),
      capabilities: entity.capabilities,
    };

    const scenes = entitySpotlightTemplate.render(spotlightData);
    const videoId = `spotlight-${entity.type}-${entity.slug}`;

    await db.collection("video_queue").doc(videoId).set({
      templateId: "entity-spotlight",
      status: "pending",
      entitySlug: entity.slug,
      entityType: entity.type,
      createdAt: NOW,
      config: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationFrames: 1800,
      },
      scenes,
      data: spotlightData,
    });

    console.log(`  ✓ [video] Spotlight: ${entity.name} — ${scenes.length} scenes`);
    videoCount++;
  }

  // Daily roundup videos for channels with 2+ entities
  for (const [channel, entities] of Object.entries(channelGroups)) {
    if (entities.length < 2) continue;

    const chName = channelNames[channel] || channel;
    const roundupData = {
      date: new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
      channel: chName,
      entities: entities.map((e) => ({
        name: e.name,
        type: e.type,
        provider: e.provider,
        description: e.description,
        composite: e.scores.composite || 0,
        grade: gradeFromScore(e.scores.composite || 0),
        capabilities: e.capabilities,
      })),
    };

    const scenes = dailyRoundupTemplate.render(roundupData);
    const videoId = `roundup-${channel}-${TODAY}`;

    await db.collection("video_queue").doc(videoId).set({
      templateId: "daily-roundup",
      status: "pending",
      channel,
      createdAt: NOW,
      config: {
        width: 1920,
        height: 1080,
        fps: 30,
        durationFrames: 3600,
      },
      scenes,
      data: roundupData,
    });

    console.log(`  ✓ [video] Roundup: ${chName} — ${scenes.length} scenes`);
    videoCount++;
  }

  // ─── Summary ───────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log(`  Episodes created:  ${episodeCount}`);
  console.log(`    - Narrations:    ${seedEntities.length}`);
  console.log(`    - Digests:       ${Object.keys(channelGroups).length}`);
  console.log(`    - Podcasts:      1 (inaugural)`);
  console.log(`  Video manifests:   ${videoCount}`);
  console.log(`    - Spotlights:    ${seedEntities.length}`);
  console.log(`    - Roundups:      ${Object.entries(channelGroups).filter(([, e]) => e.length >= 2).length}`);
  console.log("═══════════════════════════════════════════════════");
  console.log("\nFirst publish content is ready.");
  console.log("  → Listen page:  https://aaas.blog/listen");
  console.log("  → Podcast feed: https://aaas.blog/api/podcast/feed");
  console.log("  → Video queue:  https://aaas.blog/api/video/queue");
  console.log("\nTo generate real audio, set TTS_PROVIDER or ELEVENLABS_API_KEY");
  console.log("and run: npx tsx src/agents/audio-agent.ts");
}

publishEpisodes().catch(console.error);
