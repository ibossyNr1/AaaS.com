import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EntityType } from "@/lib/types";

const COLLECTION_MAP: Record<EntityType, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { type: string; slug: string } },
) {
  try {
    const { type, slug } = params;

    const collectionName = COLLECTION_MAP[type as EntityType];
    if (!collectionName) {
      return NextResponse.json(
        { error: `Invalid entity type: "${type}"` },
        { status: 400 },
      );
    }

    const changelogRef = collection(db, collectionName, slug, "changelog");
    const q = query(
      changelogRef,
      orderBy("timestamp", "desc"),
      firestoreLimit(20),
    );

    const snap = await getDocs(q);

    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ data, count: data.length });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
