import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ALL_EVENT_TYPES } from "@/lib/events";
import type { IndexEventType } from "@/lib/events";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function getApiKey(req: NextRequest): string | null {
  const key = req.headers.get("x-api-key");
  return key && key.trim().length > 0 ? key.trim() : null;
}

// ---------------------------------------------------------------------------
// GET — List registered webhooks for the authenticated user
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const apiKey = getApiKey(req);
  if (!apiKey) {
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

    const webhooks = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        url: data.url,
        events: data.events,
        active: data.active,
        createdAt: data.createdAt,
        lastDelivery: data.lastDelivery ?? null,
        failureCount: data.failureCount ?? 0,
      };
    });

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
  const apiKey = getApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
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

  // Validate URL
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
    (e) => !ALL_EVENT_TYPES.includes(e as IndexEventType),
  );
  if (invalidEvents.length > 0) {
    return NextResponse.json(
      {
        error: `Invalid event(s): ${invalidEvents.join(", ")}. Allowed: ${ALL_EVENT_TYPES.join(", ")}`,
      },
      { status: 400 },
    );
  }

  // Validate secret
  const secret = body.secret as string | undefined;
  if (!secret || typeof secret !== "string" || secret.trim().length < 8) {
    return NextResponse.json(
      { error: "Missing required field: secret (minimum 8 characters)." },
      { status: 400 },
    );
  }

  try {
    const subscription = {
      url,
      events: events as IndexEventType[],
      secret: secret.trim(),
      active: true,
      createdAt: new Date().toISOString(),
      failureCount: 0,
      createdBy: apiKey,
    };

    const docRef = await addDoc(collection(db, "webhooks"), subscription);

    return NextResponse.json(
      {
        id: docRef.id,
        url: subscription.url,
        events: subscription.events,
        active: subscription.active,
        createdAt: subscription.createdAt,
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

// ---------------------------------------------------------------------------
// DELETE — Remove a webhook by ID
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  const apiKey = getApiKey(req);
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const webhookId = searchParams.get("id");

  if (!webhookId) {
    return NextResponse.json(
      { error: "Missing required query parameter: id" },
      { status: 400 },
    );
  }

  try {
    // Verify the webhook belongs to this user
    const q = query(
      collection(db, "webhooks"),
      where("createdBy", "==", apiKey),
    );
    const snap = await getDocs(q);
    const target = snap.docs.find((d) => d.id === webhookId);

    if (!target) {
      return NextResponse.json(
        { error: "Webhook not found or not owned by this API key." },
        { status: 404 },
      );
    }

    await deleteDoc(doc(db, "webhooks", webhookId));

    return NextResponse.json(
      { message: "Webhook deleted successfully.", id: webhookId },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
