import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> },
) {
  const { type, slug } = await params;

  // Map type to collection name
  const collectionMap: Record<string, string> = {
    tool: "tools",
    model: "models",
    agent: "agents",
    skill: "skills",
    script: "scripts",
    benchmark: "benchmarks",
  };
  const collName = collectionMap[type];
  if (!collName) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const historyRef = collection(db, collName, slug, "score_history");
    const q = query(historyRef, orderBy("timestamp", "desc"), limit(30));
    const snap = await getDocs(q);

    const history = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(history, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json([], {
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }
}
