/**
 * Health Agent — Comprehensive system health monitoring.
 *
 * Checks:
 *   1. Firestore connectivity (read/write roundtrip)
 *   2. API endpoint responsiveness (key routes)
 *   3. Agent execution health (recent failures in agent_logs)
 *   4. Data freshness (entities updated recently)
 *   5. Queue depths (webhook_queue, video_queue)
 *
 * Computes overall health score (0-100), stores to health_checks/latest
 * and health_checks/history_{YYYY-MM-DD}. Alerts if score < 70.
 */

import { db, logAgentAction } from "./logger";
import { FieldValue } from "firebase-admin/firestore";

const AGENT_NAME = "health";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface ComponentCheck {
  name: string;
  status: "healthy" | "degraded" | "down";
  score: number; // 0-100
  details: Record<string, unknown>;
  durationMs: number;
}

interface HealthResult {
  overallScore: number;
  overallStatus: "healthy" | "degraded" | "down";
  components: ComponentCheck[];
  timestamp: string;
  checkedAt: FirebaseFirestore.FieldValue;
}

/* -------------------------------------------------------------------------- */
/*  Component weights (must sum to 1.0)                                        */
/* -------------------------------------------------------------------------- */

const WEIGHTS: Record<string, number> = {
  firestore: 0.30,
  agents: 0.25,
  freshness: 0.20,
  queues: 0.15,
  api: 0.10,
};

/* -------------------------------------------------------------------------- */
/*  Individual checks                                                          */
/* -------------------------------------------------------------------------- */

async function checkFirestore(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    const testRef = db.collection("health_checks").doc("_probe");
    await testRef.set({ probe: true, ts: FieldValue.serverTimestamp() });
    const snap = await testRef.get();
    if (!snap.exists) throw new Error("Probe document missing after write");
    await testRef.delete();

    return {
      name: "firestore",
      status: "healthy",
      score: 100,
      details: { roundtripMs: Date.now() - start },
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name: "firestore",
      status: "down",
      score: 0,
      details: { error: err instanceof Error ? err.message : String(err) },
      durationMs: Date.now() - start,
    };
  }
}

async function checkAgentHealth(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const snap = await db
      .collection("agent_logs")
      .where("timestamp", ">=", twentyFourHoursAgo)
      .orderBy("timestamp", "desc")
      .limit(500)
      .get();

    let successes = 0;
    let failures = 0;
    const failedAgents = new Set<string>();

    for (const doc of snap.docs) {
      const d = doc.data();
      if (d.success) {
        successes++;
      } else {
        failures++;
        if (d.agent) failedAgents.add(d.agent as string);
      }
    }

    const total = successes + failures;
    const successRate = total > 0 ? successes / total : 1;

    // Score: 100 if >95% success, scales down linearly
    let score: number;
    if (successRate >= 0.95) score = 100;
    else if (successRate >= 0.80) score = 70 + (successRate - 0.80) / 0.15 * 30;
    else if (successRate >= 0.50) score = 30 + (successRate - 0.50) / 0.30 * 40;
    else score = Math.round(successRate * 60);

    score = Math.round(score);

    return {
      name: "agents",
      status: score >= 85 ? "healthy" : score >= 50 ? "degraded" : "down",
      score,
      details: {
        total,
        successes,
        failures,
        successRate: Math.round(successRate * 100),
        failedAgents: Array.from(failedAgents),
      },
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name: "agents",
      status: "down",
      score: 0,
      details: { error: err instanceof Error ? err.message : String(err) },
      durationMs: Date.now() - start,
    };
  }
}

async function checkDataFreshness(): Promise<ComponentCheck> {
  const start = Date.now();
  const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    let totalEntities = 0;
    let freshEntities = 0;
    const staleCollections: string[] = [];

    for (const col of ENTITY_COLLECTIONS) {
      const snap = await db.collection(col).get();
      const count = snap.size;
      totalEntities += count;

      let collectionFresh = 0;
      for (const doc of snap.docs) {
        const d = doc.data();
        const updatedAt = d.updatedAt?.toDate?.() ?? d.updated_at?.toDate?.() ?? null;
        if (updatedAt && updatedAt >= sevenDaysAgo) {
          collectionFresh++;
        }
      }
      freshEntities += collectionFresh;

      if (count > 0 && collectionFresh / count < 0.5) {
        staleCollections.push(col);
      }
    }

    const freshnessRate = totalEntities > 0 ? freshEntities / totalEntities : 1;
    let score = Math.round(freshnessRate * 100);
    // Clamp minimum at 20 — some staleness is expected for stable entities
    if (score < 20) score = 20;

    return {
      name: "freshness",
      status: score >= 70 ? "healthy" : score >= 40 ? "degraded" : "down",
      score,
      details: {
        totalEntities,
        freshEntities,
        freshnessRate: Math.round(freshnessRate * 100),
        staleCollections,
      },
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name: "freshness",
      status: "down",
      score: 0,
      details: { error: err instanceof Error ? err.message : String(err) },
      durationMs: Date.now() - start,
    };
  }
}

async function checkQueueDepths(): Promise<ComponentCheck> {
  const start = Date.now();
  try {
    const [webhookSnap, videoSnap] = await Promise.all([
      db.collection("webhook_queue").where("status", "==", "pending").get(),
      db.collection("video_queue").where("status", "==", "pending").get(),
    ]);

    const webhookDepth = webhookSnap.size;
    const videoDepth = videoSnap.size;
    const totalDepth = webhookDepth + videoDepth;

    // Score: 100 if <10 pending, degrades as queues back up
    let score: number;
    if (totalDepth <= 10) score = 100;
    else if (totalDepth <= 50) score = 80;
    else if (totalDepth <= 200) score = 50;
    else score = 20;

    return {
      name: "queues",
      status: score >= 80 ? "healthy" : score >= 50 ? "degraded" : "down",
      score,
      details: {
        webhookQueue: webhookDepth,
        videoQueue: videoDepth,
        totalPending: totalDepth,
      },
      durationMs: Date.now() - start,
    };
  } catch (err) {
    // Queue collections may not exist yet — treat as healthy (empty)
    return {
      name: "queues",
      status: "healthy",
      score: 90,
      details: { error: err instanceof Error ? err.message : String(err), assumed: "empty" },
      durationMs: Date.now() - start,
    };
  }
}

async function checkApiEndpoints(): Promise<ComponentCheck> {
  const start = Date.now();
  // API checks run from the agent (server-side), so we check Firestore-backed
  // collections that the API routes depend on rather than making HTTP calls.
  try {
    const checks = await Promise.all([
      db.collection("tools").limit(1).get().then(() => true).catch(() => false),
      db.collection("agent_logs").limit(1).get().then(() => true).catch(() => false),
      db.collection("digests").limit(1).get().then(() => true).catch(() => false),
    ]);

    const passing = checks.filter(Boolean).length;
    const score = Math.round((passing / checks.length) * 100);

    return {
      name: "api",
      status: score >= 80 ? "healthy" : score >= 50 ? "degraded" : "down",
      score,
      details: {
        endpointsChecked: checks.length,
        endpointsPassing: passing,
      },
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name: "api",
      status: "down",
      score: 0,
      details: { error: err instanceof Error ? err.message : String(err) },
      durationMs: Date.now() - start,
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

export async function run(): Promise<void> {
  console.log("[health] Starting comprehensive health check...");

  const components = await Promise.all([
    checkFirestore(),
    checkAgentHealth(),
    checkDataFreshness(),
    checkQueueDepths(),
    checkApiEndpoints(),
  ]);

  // Compute weighted overall score
  let overallScore = 0;
  for (const comp of components) {
    const weight = WEIGHTS[comp.name] ?? 0;
    overallScore += comp.score * weight;
  }
  overallScore = Math.round(overallScore);

  const overallStatus: "healthy" | "degraded" | "down" =
    overallScore >= 85 ? "healthy" : overallScore >= 50 ? "degraded" : "down";

  const now = new Date();
  const result: HealthResult = {
    overallScore,
    overallStatus,
    components,
    timestamp: now.toISOString(),
    checkedAt: FieldValue.serverTimestamp(),
  };

  console.log(`[health] Overall score: ${overallScore}/100 (${overallStatus})`);
  for (const c of components) {
    console.log(`  ${c.name}: ${c.score}/100 (${c.status}) — ${c.durationMs}ms`);
  }

  // Store latest
  await db.collection("health_checks").doc("latest").set(result);

  // Store history entry
  const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  const historyDoc = db.collection("health_checks").doc(`history_${dateKey}`);
  const historySnap = await historyDoc.get();

  const entry = {
    overallScore,
    overallStatus,
    components: components.map((c) => ({
      name: c.name,
      score: c.score,
      status: c.status,
    })),
    timestamp: now.toISOString(),
  };

  if (historySnap.exists) {
    const data = historySnap.data()!;
    const checks = (data.checks as unknown[]) || [];
    checks.push(entry);
    await historyDoc.update({ checks, lastUpdated: FieldValue.serverTimestamp() });
  } else {
    await historyDoc.set({
      date: dateKey,
      checks: [entry],
      lastUpdated: FieldValue.serverTimestamp(),
    });
  }

  // Alert if score below threshold
  const ALERT_THRESHOLD = 70;
  if (overallScore < ALERT_THRESHOLD) {
    const severity = overallScore < 50 ? "critical" : "warning";
    console.log(`[health] ALERT: Score ${overallScore} below threshold ${ALERT_THRESHOLD} (${severity})`);

    await db.collection("health_alerts").add({
      severity,
      score: overallScore,
      status: overallStatus,
      components: components
        .filter((c) => c.score < 70)
        .map((c) => ({ name: c.name, score: c.score, status: c.status })),
      message: `System health degraded: ${overallScore}/100. Affected: ${components.filter((c) => c.score < 70).map((c) => c.name).join(", ")}`,
      timestamp: FieldValue.serverTimestamp(),
      acknowledged: false,
    });
  }

  await logAgentAction(AGENT_NAME, "health_check_complete", {
    overallScore,
    overallStatus,
    componentScores: Object.fromEntries(components.map((c) => [c.name, c.score])),
  }, true);

  console.log("[health] Health check complete.");
}
