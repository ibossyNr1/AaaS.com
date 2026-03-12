import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function checkAuth(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key");
  const uid = req.headers.get("x-admin-uid");
  return !!(apiKey?.trim() || uid?.trim());
}

// ---------------------------------------------------------------------------
// Known agents
// ---------------------------------------------------------------------------

const KNOWN_AGENTS = [
  "audit",
  "heal",
  "enrich",
  "freshness",
  "changelog",
  "rank",
  "categorize",
  "validate-links",
  "media",
  "ingest",
  "auto-review",
  "webhook",
  "digest-email",
  "views",
  "trending",
  "runner",
];

// ---------------------------------------------------------------------------
// GET — List all agents with status
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    // Fetch agent log summaries from Firestore
    const logsSnap = await db
      .collection("agent_logs")
      .orderBy("timestamp", "desc")
      .limit(200)
      .get();

    // Build agent summaries from logs
    const agentMap = new Map<
      string,
      {
        name: string;
        lastRunTime: string | null;
        lastStatus: boolean | null;
        runCount: number;
        errorCount: number;
        lastAction: string | null;
      }
    >();

    // Initialize known agents
    for (const name of KNOWN_AGENTS) {
      agentMap.set(name, {
        name,
        lastRunTime: null,
        lastStatus: null,
        runCount: 0,
        errorCount: 0,
        lastAction: null,
      });
    }

    // Process logs
    for (const doc of logsSnap.docs) {
      const data = doc.data();
      const agent = data.agent as string;
      if (!agent) continue;

      const existing = agentMap.get(agent) ?? {
        name: agent,
        lastRunTime: null,
        lastStatus: null,
        runCount: 0,
        errorCount: 0,
        lastAction: null,
      };

      existing.runCount += 1;
      if (data.success === false) {
        existing.errorCount += 1;
      }

      // Update "last" fields if this is the most recent log for this agent
      if (!existing.lastRunTime) {
        existing.lastRunTime = (data.timestamp as string) || null;
        existing.lastStatus = data.success ?? null;
        existing.lastAction = (data.action as string) || null;
      }

      agentMap.set(agent, existing);
    }

    const agents = Array.from(agentMap.values()).sort((a, b) => {
      // Errored agents first, then by name
      if (a.errorCount > 0 && b.errorCount === 0) return -1;
      if (a.errorCount === 0 && b.errorCount > 0) return 1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ agents, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — Trigger a specific agent run
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const agent = body.agent as string | undefined;
  if (!agent || agent.trim().length === 0) {
    return NextResponse.json({ error: "Missing agent name." }, { status: 400 });
  }

  try {
    const now = new Date().toISOString();

    // Write to agent_triggers collection for the runner to pick up
    const triggerRef = await db.collection("agent_triggers").add({
      agent: agent.trim(),
      requestedAt: now,
      requestedBy: req.headers.get("x-admin-uid") || req.headers.get("x-api-key") || "admin",
      status: "pending",
    });

    return NextResponse.json({
      message: `Agent run triggered for "${agent}".`,
      triggerId: triggerRef.id,
      agent,
      requestedAt: now,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
