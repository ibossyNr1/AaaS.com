import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VALID_WEBHOOK_EVENTS } from "@/lib/webhooks";
import type { WebhookEvent } from "@/lib/webhooks";

// ---------------------------------------------------------------------------
// GET — List all webhook subscriptions for the authenticated API key
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  try {
    const q = query(
      collection(db, "webhooks"),
      where("createdBy", "==", apiKey),
    );
    const snap = await getDocs(q);

    const webhooks = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ webhooks }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Register a new webhook subscription
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  // Validate url
  const url = body.url as string | undefined;
  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing required field: url" },
      { status: 400 },
    );
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format." },
      { status: 400 },
    );
  }

  // Validate events
  const events = body.events as unknown;
  if (!Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { error: "Missing or empty required field: events (must be a non-empty array)." },
      { status: 400 },
    );
  }

  const invalidEvents = (events as string[]).filter(
    (e) => !VALID_WEBHOOK_EVENTS.includes(e as WebhookEvent),
  );
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      {
        error: `Invalid event(s): ${invalidEvents.join(", ")}. Allowed: ${VALID_WEBHOOK_EVENTS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Validate secret
  const secret = body.secret as string | undefined;
  if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing required field: secret" },
      { status: 400 },
    );
  }

  try {
    const subscription = {
      url,
      events: events as WebhookEvent[],
      secret,
      active: true,
      createdAt: new Date().toISOString(),
      failureCount: 0,
      createdBy: apiKey,
    };

    const docRef = await addDoc(collection(db, "webhooks"), subscription);

    return NextResponse.json(
      {
        id: docRef.id,
        ...subscription,
        // Never echo the secret back in full
        secret: undefined,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
