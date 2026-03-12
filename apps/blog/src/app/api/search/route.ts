import { NextRequest, NextResponse } from "next/server";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Entity } from "@/lib/types";

const COLLECTION_MAP: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

const ALL_COLLECTIONS = Object.values(COLLECTION_MAP);
const VALID_TYPES = new Set(Object.keys(COLLECTION_MAP));
const VALID_SORT = new Set(["composite", "newest", "name"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.toLowerCase().trim() || "";
  const type = searchParams.get("type") || "";
  const channel = searchParams.get("channel") || "";
  const sort = searchParams.get("sort") || "composite";
  const limit = Math.min(Number(searchParams.get("limit") || 100), 200);

  if (sort && !VALID_SORT.has(sort)) {
    return NextResponse.json(
      { error: `Invalid sort. Valid: ${Array.from(VALID_SORT).join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const collections = type && VALID_TYPES.has(type)
      ? [COLLECTION_MAP[type]]
      : ALL_COLLECTIONS;

    const results: Entity[] = [];
    const perCollection = Math.ceil(limit / collections.length);

    await Promise.all(
      collections.map(async (col) => {
        const constraints: QueryConstraint[] = [];

        if (channel) {
          constraints.push(where("category", "==", channel));
        }

        if (sort === "newest") {
          constraints.push(orderBy("addedDate", "desc"));
        } else {
          constraints.push(orderBy("scores.composite", "desc"));
        }

        constraints.push(firestoreLimit(perCollection));

        const snap = await getDocs(query(collection(db, col), ...constraints));
        for (const d of snap.docs) {
          results.push({ slug: d.id, ...d.data() } as Entity);
        }
      }),
    );

    // Client-side text search (Firestore doesn't support full-text)
    let filtered = results;
    if (q) {
      filtered = results.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.provider.toLowerCase().includes(q) ||
          (e.tags && e.tags.some((t: string) => t.toLowerCase().includes(q))),
      );
    }

    // Sort
    if (sort === "newest") {
      filtered.sort((a, b) => b.addedDate.localeCompare(a.addedDate));
    } else if (sort === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      filtered.sort((a, b) => b.scores.composite - a.scores.composite);
    }

    const final = filtered.slice(0, limit);

    return NextResponse.json({
      data: final,
      count: final.length,
      total: results.length,
      query: q || null,
      filters: { type: type || null, channel: channel || null, sort },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    );
  }
}
