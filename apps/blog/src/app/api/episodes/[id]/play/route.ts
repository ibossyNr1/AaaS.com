export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Missing episode ID" },
      { status: 400 },
    );
  }

  try {
    const ref = doc(db, "episodes", id);
    await updateDoc(ref, { playCount: increment(1) });
    return NextResponse.json({ success: true, episodeId: id });
  } catch {
    return NextResponse.json(
      { error: "Failed to update play count" },
      { status: 500 },
    );
  }
}
