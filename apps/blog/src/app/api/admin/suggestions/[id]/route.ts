import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// PATCH — Accept or dismiss a categorization suggestion
// ---------------------------------------------------------------------------

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const action = body.action as string | undefined;
  if (action !== "accept" && action !== "dismiss") {
    return NextResponse.json(
      { error: 'Invalid action. Must be "accept" or "dismiss".' },
      { status: 400 },
    );
  }

  try {
    const suggestionRef = db.collection("categorization_suggestions").doc(id);
    const suggestionDoc = await suggestionRef.get();

    if (!suggestionDoc.exists) {
      return NextResponse.json(
        { error: "Suggestion not found." },
        { status: 404 },
      );
    }

    const suggestion = suggestionDoc.data()!;
    const now = new Date().toISOString();

    if (action === "accept") {
      // Update the entity's category to the suggested value
      const entityCollection = suggestion.entityCollection as string;
      const entityId = suggestion.entityId as string;
      const suggestedCategory = suggestion.suggestedCategory as string;

      if (!entityCollection || !entityId || !suggestedCategory) {
        return NextResponse.json(
          { error: "Suggestion is missing required entity reference fields." },
          { status: 400 },
        );
      }

      await db.collection(entityCollection).doc(entityId).update({
        category: suggestedCategory,
        lastUpdated: now,
      });

      await suggestionRef.update({
        status: "accepted",
        reviewedAt: now,
        reviewedBy: "admin",
      });

      return NextResponse.json(
        {
          id,
          status: "accepted",
          message: `Category updated to "${suggestedCategory}" for ${entityCollection}/${entityId}.`,
        },
        { status: 200 },
      );
    } else {
      // Dismiss
      await suggestionRef.update({
        status: "dismissed",
        reviewedAt: now,
        reviewedBy: "admin",
      });

      return NextResponse.json(
        {
          id,
          status: "dismissed",
          message: "Suggestion dismissed.",
        },
        { status: 200 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
