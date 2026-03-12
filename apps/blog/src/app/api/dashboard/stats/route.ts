import { NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
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

const AGENT_NAMES = [
  "audit",
  "heal",
  "freshness",
  "rank",
  "validate-links",
  "media",
  "ingest",
];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

interface AgentSummary {
  name: string;
  lastRunTime: string | null;
  lastStatus: boolean | null;
  runCount: number;
  lastAction: string | null;
}

interface AgentLogDoc {
  agent: string;
  action: string;
  success: boolean;
  timestamp: { toDate?: () => Date; seconds?: number } | null;
  error?: string;
}

interface RecentLog {
  timestamp: string | null;
  agent: string;
  action: string;
  success: boolean;
}

function toISOString(ts: { toDate?: () => Date; seconds?: number } | null | undefined): string | null {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate().toISOString();
  if (typeof ts.seconds === "number") return new Date(ts.seconds * 1000).toISOString();
  return null;
}

/* -------------------------------------------------------------------------- */
/*  GET /api/dashboard/stats                                                   */
/* -------------------------------------------------------------------------- */

export async function GET() {
  const now = new Date();

  /* -- Agent logs ---------------------------------------------------------- */
  let agents: AgentSummary[] = AGENT_NAMES.map((name) => ({
    name,
    lastRunTime: null,
    lastStatus: null,
    runCount: 0,
    lastAction: null,
  }));

  let recentLogs: RecentLog[] = [];

  try {
    const logsQ = query(
      collection(db, "agent_logs"),
      orderBy("timestamp", "desc"),
      firestoreLimit(50),
    );
    const logsSnap = await getDocs(logsQ);
    const logs = logsSnap.docs.map((d) => d.data() as AgentLogDoc);

    // Group by agent
    const grouped = new Map<string, AgentLogDoc[]>();
    for (const log of logs) {
      const arr = grouped.get(log.agent) || [];
      arr.push(log);
      grouped.set(log.agent, arr);
    }

    agents = AGENT_NAMES.map((name) => {
      const agentLogs = grouped.get(name) || [];
      const latest = agentLogs[0] || null;
      return {
        name,
        lastRunTime: latest ? toISOString(latest.timestamp) : null,
        lastStatus: latest ? latest.success : null,
        runCount: agentLogs.length,
        lastAction: latest ? latest.action : null,
      };
    });

    // Recent logs for the table (last 10 from all agents, excluding "runner")
    recentLogs = logs
      .filter((l) => l.agent !== "runner")
      .slice(0, 10)
      .map((l) => ({
        timestamp: toISOString(l.timestamp),
        agent: l.agent,
        action: l.action,
        success: l.success,
      }));
  } catch (err) {
    console.error("[dashboard/stats] Failed to fetch agent_logs:", err);
  }

  /* -- Entity health ------------------------------------------------------- */
  let totalEntities = 0;
  let totalCompleteness = 0;
  let brokenLinksCount = 0;
  let staleCount = 0;
  const entityCountByType: Record<string, number> = {};

  for (const [type, col] of Object.entries(COLLECTION_MAP)) {
    try {
      const snap = await getDocs(collection(db, col));
      const count = snap.size;
      entityCountByType[type] = count;
      totalEntities += count;

      for (const doc of snap.docs) {
        const data = doc.data();

        // Schema completeness
        if (typeof data.schemaCompleteness === "number") {
          totalCompleteness += data.schemaCompleteness;
        }

        // Broken links
        if (Array.isArray(data.brokenLinks) && data.brokenLinks.length > 0) {
          brokenLinksCount += 1;
        }

        // Stale check (lastVerified > 30 days ago)
        if (data.lastVerified) {
          const verified = new Date(data.lastVerified);
          if (now.getTime() - verified.getTime() > THIRTY_DAYS_MS) {
            staleCount += 1;
          }
        }
      }
    } catch (err) {
      console.error(`[dashboard/stats] Failed to fetch ${col}:`, err);
      entityCountByType[type] = 0;
    }
  }

  const avgCompleteness = totalEntities > 0 ? Math.round(totalCompleteness / totalEntities) : 0;

  /* -- Healing queue ------------------------------------------------------- */
  let healingQueuePending = 0;
  try {
    const healSnap = await getDocs(collection(db, "healing_queue"));
    healingQueuePending = healSnap.docs.filter(
      (d) => d.data().status === "pending",
    ).length;
  } catch (err) {
    console.error("[dashboard/stats] Failed to fetch healing_queue:", err);
  }

  /* -- Media / episodes ---------------------------------------------------- */
  let totalEpisodes = 0;
  const formatCounts: Record<string, number> = {
    narration: 0,
    digest: 0,
    podcast: 0,
  };

  try {
    const epSnap = await getDocs(collection(db, "episodes"));
    totalEpisodes = epSnap.size;
    for (const d of epSnap.docs) {
      const format = d.data().format as string;
      if (format in formatCounts) {
        formatCounts[format] += 1;
      }
    }
  } catch (err) {
    console.error("[dashboard/stats] Failed to fetch episodes:", err);
  }

  /* -- Response ------------------------------------------------------------ */
  const body = {
    agents,
    entityHealth: {
      totalEntities,
      avgCompleteness,
      brokenLinksCount,
      staleCount,
      healingQueuePending,
      countByType: entityCountByType,
    },
    media: {
      totalEpisodes,
      formatCounts,
      coverage:
        totalEntities > 0
          ? Math.round((totalEpisodes / totalEntities) * 100)
          : 0,
    },
    recentLogs,
    timestamp: now.toISOString(),
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}
