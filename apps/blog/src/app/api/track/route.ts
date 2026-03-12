export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize firebase-admin once
if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}

const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { path, entityType, entitySlug, referrer } = body as {
      path?: string;
      entityType?: string;
      entitySlug?: string;
      referrer?: string;
    };

    if (!path || typeof path !== "string") {
      return NextResponse.json(
        { error: "Missing required field: path" },
        { status: 400 }
      );
    }

    const now = new Date();
    const date = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // Write individual page view document
    const viewData: Record<string, unknown> = {
      path,
      timestamp: FieldValue.serverTimestamp(),
      date,
    };
    if (entityType) viewData.entityType = entityType;
    if (entitySlug) viewData.entitySlug = entitySlug;
    if (referrer) viewData.referrer = referrer;

    // Fire both writes in parallel
    await Promise.all([
      db.collection("page_views").add(viewData),
      db
        .collection("page_view_counts")
        .doc(date)
        .set({ count: FieldValue.increment(1) }, { merge: true }),
    ]);

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
