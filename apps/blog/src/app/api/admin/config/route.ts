import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

const CONFIG_DOC = "system_config/main";

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function checkAuth(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key");
  const uid = req.headers.get("x-admin-uid");
  return !!(apiKey?.trim() || uid?.trim());
}

// ---------------------------------------------------------------------------
// Default config shape
// ---------------------------------------------------------------------------

interface SystemConfig {
  agentSchedule: Record<string, { enabled: boolean; intervalMinutes: number }>;
  featureFlags: Record<string, boolean>;
  rateLimits: {
    apiRequestsPerMinute: number;
    submissionsPerDay: number;
    webhooksPerHour: number;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  lastUpdated: string;
  updatedBy: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  agentSchedule: {
    audit: { enabled: true, intervalMinutes: 60 },
    heal: { enabled: true, intervalMinutes: 120 },
    enrich: { enabled: true, intervalMinutes: 180 },
    freshness: { enabled: true, intervalMinutes: 360 },
    changelog: { enabled: true, intervalMinutes: 60 },
    rank: { enabled: true, intervalMinutes: 30 },
    categorize: { enabled: true, intervalMinutes: 240 },
    "validate-links": { enabled: true, intervalMinutes: 720 },
    media: { enabled: true, intervalMinutes: 120 },
    ingest: { enabled: true, intervalMinutes: 60 },
    "auto-review": { enabled: true, intervalMinutes: 30 },
    webhook: { enabled: true, intervalMinutes: 5 },
    "digest-email": { enabled: true, intervalMinutes: 1440 },
    views: { enabled: true, intervalMinutes: 15 },
    trending: { enabled: true, intervalMinutes: 30 },
    runner: { enabled: true, intervalMinutes: 5 },
  },
  featureFlags: {
    submissions: true,
    webhooks: true,
    podcast: true,
    video: true,
    comments: true,
    search: true,
    personalization: true,
    emailDigests: true,
  },
  rateLimits: {
    apiRequestsPerMinute: 60,
    submissionsPerDay: 50,
    webhooksPerHour: 1000,
  },
  maintenance: {
    enabled: false,
    message: "",
  },
  lastUpdated: new Date().toISOString(),
  updatedBy: "system",
};

// ---------------------------------------------------------------------------
// GET — Read system config
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const [colPath, docId] = CONFIG_DOC.split("/");
    const snap = await db.collection(colPath).doc(docId).get();

    if (!snap.exists) {
      // Return defaults if no config stored yet
      return NextResponse.json({ config: DEFAULT_CONFIG, source: "defaults" });
    }

    const config = snap.data() as SystemConfig;
    return NextResponse.json({ config, source: "firestore" });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PUT — Update system config
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const [colPath, docId] = CONFIG_DOC.split("/");
    const docRef = db.collection(colPath).doc(docId);

    // Read existing or use defaults
    const snap = await docRef.get();
    const existing = snap.exists ? (snap.data() as SystemConfig) : { ...DEFAULT_CONFIG };

    // Merge updates — only allow known top-level keys
    const allowedKeys = new Set(["agentSchedule", "featureFlags", "rateLimits", "maintenance"]);
    const updates: Record<string, unknown> = {};
    const existingRecord = existing as unknown as Record<string, unknown>;

    for (const [key, value] of Object.entries(body)) {
      if (allowedKeys.has(key)) {
        // Deep merge for objects
        if (
          typeof value === "object" &&
          value !== null &&
          typeof existingRecord[key] === "object"
        ) {
          updates[key] = {
            ...(existingRecord[key] as Record<string, unknown>),
            ...(value as Record<string, unknown>),
          };
        } else {
          updates[key] = value;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid config keys provided. Allowed: agentSchedule, featureFlags, rateLimits, maintenance." },
        { status: 400 },
      );
    }

    updates.lastUpdated = new Date().toISOString();
    updates.updatedBy = req.headers.get("x-admin-uid") || req.headers.get("x-api-key") || "admin";

    await docRef.set({ ...existing, ...updates }, { merge: true });

    return NextResponse.json({
      message: "Config updated.",
      updatedKeys: Object.keys(updates).filter((k) => k !== "lastUpdated" && k !== "updatedBy"),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
