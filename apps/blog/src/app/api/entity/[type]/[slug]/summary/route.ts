export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EntityType } from "@/lib/types";

const VALID_TYPES: Set<string> = new Set([
  "tool", "model", "agent", "skill", "script", "benchmark",
]);

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; slug: string } },
) {
  try {
    const { type, slug } = params;

    if (!VALID_TYPES.has(type)) {
      return NextResponse.json(
        { error: `Invalid entity type: "${type}"` },
        { status: 400 },
      );
    }

    const docId = `${type as EntityType}_${slug}`;
    const docRef = doc(db, "entity_summaries", docId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json(null, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    const data = snap.data();

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
