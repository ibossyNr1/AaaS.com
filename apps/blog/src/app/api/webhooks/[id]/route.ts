export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// DELETE — Remove a webhook subscription by ID
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  const { id } = params;

  try {
    // Verify the webhook exists and belongs to this API key
    const docRef = doc(db, "webhooks", id);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json(
        { error: "Webhook not found." },
        { status: 404 },
      );
    }

    const data = snap.data();
    if (data.createdBy !== apiKey) {
      return NextResponse.json(
        { error: "Unauthorized — webhook does not belong to this API key." },
        { status: 403 },
      );
    }

    await deleteDoc(docRef);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
