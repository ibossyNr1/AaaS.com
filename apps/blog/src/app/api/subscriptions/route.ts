import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  Subscription,
  SubscriptionPlan,
  DigestFrequency,
  AlertPreferences,
} from "@/lib/vault";

export const dynamic = "force-dynamic";

const VALID_PLANS: SubscriptionPlan[] = ["free", "pro", "enterprise"];
const VALID_FREQUENCIES: DigestFrequency[] = ["daily", "weekly", "monthly", "none"];

const DEFAULT_ALERTS: AlertPreferences = {
  entityAlerts: true,
  channelAlerts: true,
  weeklyDigest: true,
  trendingAlerts: false,
};

// ---------------------------------------------------------------------------
// GET — Return current user's subscription
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
      return NextResponse.json(
        {
          subscription: {
            plan: "free",
            channels: [],
            digestFrequency: "weekly",
            alertPreferences: DEFAULT_ALERTS,
            createdAt: null,
            updatedAt: null,
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { subscription: snap.data() as Subscription },
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
// POST — Create or update a subscription
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
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

  // Validate plan
  const plan = body.plan as string | undefined;
  if (plan && !VALID_PLANS.includes(plan as SubscriptionPlan)) {
    return NextResponse.json(
      { error: `Invalid plan. Must be one of: ${VALID_PLANS.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate digestFrequency
  const digestFrequency = body.digestFrequency as string | undefined;
  if (digestFrequency && !VALID_FREQUENCIES.includes(digestFrequency as DigestFrequency)) {
    return NextResponse.json(
      { error: `Invalid digestFrequency. Must be one of: ${VALID_FREQUENCIES.join(", ")}` },
      { status: 400 },
    );
  }

  // Validate channels
  const channels = body.channels as unknown;
  if (channels !== undefined && !Array.isArray(channels)) {
    return NextResponse.json(
      { error: "channels must be an array of strings." },
      { status: 400 },
    );
  }

  // Validate alertPreferences
  const alertPreferences = body.alertPreferences as Record<string, unknown> | undefined;

  try {
    const now = new Date().toISOString();
    const ref = doc(db, "subscriptions", userId);
    const existing = await getDoc(ref);

    const prev = existing.exists() ? (existing.data() as Subscription) : null;

    const subscription: Subscription = {
      plan: (plan as SubscriptionPlan) ?? prev?.plan ?? "free",
      channels: (channels as string[]) ?? prev?.channels ?? [],
      digestFrequency: (digestFrequency as DigestFrequency) ?? prev?.digestFrequency ?? "weekly",
      alertPreferences: alertPreferences
        ? { ...DEFAULT_ALERTS, ...(alertPreferences as unknown as AlertPreferences) }
        : prev?.alertPreferences ?? DEFAULT_ALERTS,
      createdAt: prev?.createdAt ?? now,
      updatedAt: now,
    };

    await setDoc(ref, subscription, { merge: true });

    return NextResponse.json(
      { subscription },
      { status: existing.exists() ? 200 : 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
