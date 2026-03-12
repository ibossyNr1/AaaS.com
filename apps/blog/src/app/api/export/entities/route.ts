import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ENTITY_COLLECTIONS: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

const ALL_FIELDS = [
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

type FieldName = (typeof ALL_FIELDS)[number];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return escapeCSV(value.join(";"));
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
  const SCORE_FIELDS = ["composite", "adoption", "quality", "freshness", "citations", "engagement"];
  if (SCORE_FIELDS.includes(key)) {
    const scores = entity.scores as Record<string, unknown> | undefined;
    return scores?.[key] ?? entity[key] ?? "";
  }
  return entity[key] ?? "";
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchEntities(typeFilter?: string): Promise<Record<string, unknown>[]> {
  const collectionsToQuery = typeFilter
    ? { [typeFilter]: ENTITY_COLLECTIONS[typeFilter] }
    : ENTITY_COLLECTIONS;

  const results: Record<string, unknown>[] = [];

  for (const [type, colName] of Object.entries(collectionsToQuery)) {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    for (const doc of snapshot.docs) {
      results.push({ ...doc.data(), type, id: doc.id });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Format converters
// ---------------------------------------------------------------------------

function toCSV(entities: Record<string, unknown>[], fields: FieldName[]): string {
  const lines: string[] = [fields.join(",")];
  for (const entity of entities) {
    const row = fields.map((h) => escapeCSV(resolveField(entity, h)));
    lines.push(row.join(","));
  }
  return lines.join("\n");
}

function toJSONL(entities: Record<string, unknown>[], fields: FieldName[]): string {
  return entities
    .map((entity) => {
      const obj: Record<string, unknown> = {};
      for (const f of fields) {
        obj[f] = resolveField(entity, f);
      }
      return JSON.stringify(obj);
    })
    .join("\n");
}

function toJSON(entities: Record<string, unknown>[], fields: FieldName[]): string {
  const filtered = entities.map((entity) => {
    const obj: Record<string, unknown> = {};
    for (const f of fields) {
      obj[f] = resolveField(entity, f);
    }
    return obj;
  });
  return JSON.stringify(filtered, null, 2);
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
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
    const fieldsParam = searchParams.get("fields") || undefined;

    // Validate type
    if (type && !ENTITY_COLLECTIONS[type]) {
      return NextResponse.json(
        { error: `Invalid type "${type}". Valid types: ${Object.keys(ENTITY_COLLECTIONS).join(", ")}` },
        { status: 400 },
      );
    }

    // Validate format
    if (!["json", "csv", "jsonl"].includes(format)) {
      return NextResponse.json(
        { error: `Invalid format "${format}". Valid formats: json, csv, jsonl` },
        { status: 400 },
      );
    }

    // Resolve fields
    const allFieldNames = ALL_FIELDS as unknown as string[];
    const fields: FieldName[] = fieldsParam
      ? (fieldsParam.split(",").filter((f) => allFieldNames.includes(f)) as FieldName[])
      : ([...ALL_FIELDS] as FieldName[]);

    if (fields.length === 0) {
      return NextResponse.json(
        { error: `No valid fields specified. Available: ${ALL_FIELDS.join(", ")}` },
        { status: 400 },
      );
    }

    const entities = await fetchEntities(type);
    const dateStr = getDateString();
    const rlHeaders = rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100);

    if (format === "csv") {
      return new NextResponse(toCSV(entities, fields), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aaas-entities-${dateStr}.csv"`,
          "Cache-Control": "public, max-age=300",
          ...rlHeaders,
        },
      });
    }

    if (format === "jsonl") {
      return new NextResponse(toJSONL(entities, fields), {
        status: 200,
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Content-Disposition": `attachment; filename="aaas-entities-${dateStr}.jsonl"`,
          "Cache-Control": "public, max-age=300",
          ...rlHeaders,
        },
      });
    }

    // JSON (default)
    return new NextResponse(toJSON(entities, fields), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aaas-entities-${dateStr}.json"`,
        "Cache-Control": "public, max-age=300",
        ...rlHeaders,
      },
    });
  } catch (error) {
    console.error("[export/entities] Error:", error);
    return NextResponse.json({ error: "Failed to export entities" }, { status: 500 });
  }
}
