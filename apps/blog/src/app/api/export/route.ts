export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const ENTITY_COLLECTIONS: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

const CSV_HEADERS = [
  "slug",
  "type",
  "name",
  "provider",
  "description",
  "category",
  "version",
  "pricingModel",
  "license",
  "url",
  "tags",
  "capabilities",
  "composite",
  "adoption",
  "quality",
  "freshness",
  "citations",
  "engagement",
  "addedDate",
  "lastUpdated",
] as const;

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return escapeCSV(value.join(";"));
  }

  const str = String(value);

  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

function getDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function resolveField(entity: Record<string, unknown>, key: string): unknown {
  // Handle nested score fields
  if (["composite", "adoption", "quality", "freshness", "citations", "engagement"].includes(key)) {
    const scores = entity.scores as Record<string, unknown> | undefined;
    return scores?.[key] ?? entity[key] ?? "";
  }
  return entity[key] ?? "";
}

async function fetchEntities(typeFilter?: string): Promise<Record<string, unknown>[]> {
  const collectionsToQuery = typeFilter
    ? { [typeFilter]: ENTITY_COLLECTIONS[typeFilter] }
    : ENTITY_COLLECTIONS;

  const results: Record<string, unknown>[] = [];

  for (const [type, colName] of Object.entries(collectionsToQuery)) {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);

    for (const doc of snapshot.docs) {
      const data = doc.data();
      results.push({ ...data, type, id: doc.id });
    }
  }

  return results;
}

function toCSV(entities: Record<string, unknown>[]): string {
  const lines: string[] = [CSV_HEADERS.join(",")];

  for (const entity of entities) {
    const row = CSV_HEADERS.map((header) =>
      escapeCSV(resolveField(entity, header))
    );
    lines.push(row.join(","));
  }

  return lines.join("\n");
}

export async function GET(request: NextRequest) {
  try {
    // --- Rate limiting ---
    const rl = await checkRateLimit(request);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: rl.error },
        { status: 429, headers: rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100) },
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    const type = searchParams.get("type") || undefined;

    if (type && !ENTITY_COLLECTIONS[type]) {
      return NextResponse.json(
        { error: `Invalid type "${type}". Valid types: ${Object.keys(ENTITY_COLLECTIONS).join(", ")}` },
        { status: 400 }
      );
    }

    if (format !== "json" && format !== "csv") {
      return NextResponse.json(
        { error: `Invalid format "${format}". Valid formats: json, csv` },
        { status: 400 }
      );
    }

    const entities = await fetchEntities(type);
    const dateStr = getDateString();

    if (format === "csv") {
      const csv = toCSV(entities);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="aaas-export-${dateStr}.csv"`,
          "Cache-Control": "public, max-age=300",
          ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
        },
      });
    }

    // JSON format (default)
    const body = JSON.stringify(entities, null, 2);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="aaas-export-${dateStr}.json"`,
        "Cache-Control": "public, max-age=300",
        ...rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100),
      },
    });
  } catch (error) {
    console.error("[export] Error exporting entities:", error);
    return NextResponse.json(
      { error: "Failed to export entities" },
      { status: 500 }
    );
  }
}
