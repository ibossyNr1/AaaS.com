export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EntityType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const COLLECTION_MAP: Record<EntityType, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function toDate(ts: { toDate?: () => Date; seconds?: number } | string | null | undefined): Date | null {
  if (!ts) return null;
  if (typeof ts === "string") return new Date(ts);
  if (typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function") return ts.toDate();
  if (typeof ts === "object" && "seconds" in ts && typeof ts.seconds === "number") return new Date(ts.seconds * 1000);
  return null;
}

/* -------------------------------------------------------------------------- */
/*  GET /api/stats                                                             */
/* -------------------------------------------------------------------------- */

export async function GET() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  /* -- Entities ------------------------------------------------------------ */
  let totalEntities = 0;
  let totalComposite = 0;
  const byType: Record<string, number> = {};
  const allEntities: { name: string; type: string; slug: string; composite: number }[] = [];

  for (const [type, col] of Object.entries(COLLECTION_MAP)) {
    try {
      const snap = await getDocs(collection(db, col));
      const count = snap.size;
      byType[col] = count;
      totalEntities += count;

      for (const doc of snap.docs) {
        const data = doc.data();
        const composite = data.scores?.composite ?? 0;
        totalComposite += composite;
        allEntities.push({
          name: data.name || doc.id,
          type,
          slug: data.slug || doc.id,
          composite,
        });
      }
    } catch (err) {
      console.error(`[api/stats] Failed to fetch ${col}:`, err);
      byType[col] = 0;
    }
  }

  const avgComposite = totalEntities > 0 ? Math.round((totalComposite / totalEntities) * 100) / 100 : 0;
  const topScorers = allEntities
    .sort((a, b) => b.composite - a.composite)
    .slice(0, 5);

  /* -- Agent logs ---------------------------------------------------------- */
  let totalRuns = 0;
  let successCount = 0;
  let recentFailures = 0;
  let mostActiveAgent = "none";

  try {
    const logsSnap = await getDocs(collection(db, "agent_logs"));
    totalRuns = logsSnap.size;

    const agentRunCounts: Record<string, number> = {};

    for (const doc of logsSnap.docs) {
      const data = doc.data();
      if (data.success === true) successCount++;

      // Recent failures (last 24h)
      const ts = toDate(data.timestamp);
      if (data.success === false && ts && ts >= oneDayAgo) {
        recentFailures++;
      }

      // Track most active
      const agentName = data.agent || "unknown";
      agentRunCounts[agentName] = (agentRunCounts[agentName] || 0) + 1;
    }

    // Find most active agent
    let maxRuns = 0;
    for (const [name, count] of Object.entries(agentRunCounts)) {
      if (count > maxRuns) {
        maxRuns = count;
        mostActiveAgent = name;
      }
    }
  } catch (err) {
    console.error("[api/stats] Failed to fetch agent_logs:", err);
  }

  const successRate = totalRuns > 0 ? Math.round((successCount / totalRuns) * 10000) / 100 : 0;

  /* -- Submissions --------------------------------------------------------- */
  let submissionsTotal = 0;
  let submissionsPending = 0;
  let submissionsApproved = 0;
  let submissionsRejected = 0;

  try {
    const subSnap = await getDocs(collection(db, "submissions"));
    submissionsTotal = subSnap.size;
    for (const doc of subSnap.docs) {
      const status = doc.data().status;
      if (status === "pending") submissionsPending++;
      else if (status === "approved") submissionsApproved++;
      else if (status === "rejected") submissionsRejected++;
    }
  } catch (err) {
    console.error("[api/stats] Failed to fetch submissions:", err);
  }

  /* -- Episodes ------------------------------------------------------------ */
  let totalEpisodes = 0;
  try {
    const epSnap = await getDocs(collection(db, "episodes"));
    totalEpisodes = epSnap.size;
  } catch (err) {
    console.error("[api/stats] Failed to fetch episodes:", err);
  }

  /* -- Subscribers --------------------------------------------------------- */
  let subscribersTotal = 0;
  try {
    const subSnap = await getDocs(collection(db, "subscribers"));
    subscribersTotal = subSnap.size;
  } catch (err) {
    console.error("[api/stats] Failed to fetch subscribers:", err);
  }

  /* -- API Keys ------------------------------------------------------------ */
  let apiKeysTotal = 0;
  let apiKeysActive = 0;
  try {
    const keysSnap = await getDocs(collection(db, "api_keys"));
    apiKeysTotal = keysSnap.size;
    for (const doc of keysSnap.docs) {
      const data = doc.data();
      if (data.active !== false && data.revoked !== true) {
        apiKeysActive++;
      }
    }
  } catch (err) {
    console.error("[api/stats] Failed to fetch api_keys:", err);
  }

  /* -- Trending alerts ----------------------------------------------------- */
  let recentAlerts = 0;
  try {
    const alertsSnap = await getDocs(collection(db, "trending_alerts"));
    for (const doc of alertsSnap.docs) {
      const ts = toDate(doc.data().timestamp || doc.data().createdAt);
      if (ts && ts >= sevenDaysAgo) {
        recentAlerts++;
      }
    }
  } catch (err) {
    console.error("[api/stats] Failed to fetch trending_alerts:", err);
  }

  /* -- Response ------------------------------------------------------------ */
  const body = {
    entities: {
      total: totalEntities,
      byType,
      avgComposite,
      topScorers,
    },
    agents: {
      totalRuns,
      successRate,
      recentFailures,
      mostActiveAgent,
    },
    submissions: {
      total: submissionsTotal,
      pending: submissionsPending,
      approved: submissionsApproved,
      rejected: submissionsRejected,
    },
    media: {
      totalEpisodes,
    },
    subscribers: {
      total: subscribersTotal,
    },
    apiKeys: {
      total: apiKeysTotal,
      active: apiKeysActive,
    },
    trending: {
      recentAlerts,
    },
    timestamp: now.toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}
