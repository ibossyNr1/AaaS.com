import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Subscription, AlertPreferences } from "@/lib/vault";

export const dynamic = "force-dynamic";

const DEFAULT_ALERTS: AlertPreferences = {
  entityAlerts: true,
  channelAlerts: true,
  weeklyDigest: true,
  trendingAlerts: false,
};

const VALID_KEYS: (keyof AlertPreferences)[] = [
  "entityAlerts",
  "channelAlerts",
  "weeklyDigest",
  "trendingAlerts",
];

// ---------------------------------------------------------------------------
// GET — Return alert preferences for the current user
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId || userId.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing x-user-id header." },
      { status: 401 },
    );
  }

  try {
    const ref = doc(db, "subscriptions", userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      return NextResponse.json({ alertPreferences: DEFAULT_ALERTS }, { status: 200 });
    }

    const data = snap.data() as Subscription;
    return NextResponse.json(
      { alertPreferences: data.alertPreferences ?? DEFAULT_ALERTS },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Update alert preferences
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId || userId.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing x-user-id header." },
      { status: 401 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  // Validate — only boolean values for known keys
  for (const key of Object.keys(body)) {
    if (!VALID_KEYS.includes(key as keyof AlertPreferences)) {
      return NextResponse.json(
        { error: `Unknown alert key: ${key}. Valid keys: ${VALID_KEYS.join(", ")}` },
        { status: 400 },
      );
    }
    if (typeof body[key] !== "boolean") {
      return NextResponse.json(
        { error: `${key} must be a boolean.` },
        { status: 400 },
      );
    }
  }

  try {
    const ref = doc(db, "subscriptions", userId);
    const snap = await getDoc(ref);

    const prev = snap.exists() ? (snap.data() as Subscription) : null;
    const merged: AlertPreferences = {
      ...(prev?.alertPreferences ?? DEFAULT_ALERTS),
      ...(body as Partial<AlertPreferences>),
    };

    await setDoc(
      ref,
      {
        alertPreferences: merged,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return NextResponse.json({ alertPreferences: merged }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
