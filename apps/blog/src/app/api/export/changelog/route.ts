import { NextRequest, NextResponse } from "next/server";
import {
  collectionGroup,
  getDocs,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const COLLECTION_TO_TYPE: Record<string, string> = {
  tools: "tool",
  models: "model",
  agents: "agent",
  skills: "skill",
  scripts: "script",
  benchmarks: "benchmark",
};

const VALID_TYPES = new Set(["tool", "model", "agent", "skill", "script", "benchmark"]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Change {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: "added" | "modified" | "removed";
}

interface ChangelogDoc {
  changes: Change[];
  timestamp: { toDate?: () => Date } | string;
  detectedBy?: string;
}

function toDate(ts: ChangelogDoc["timestamp"]): Date {
  if (typeof ts === "string") return new Date(ts);
  if (ts && typeof ts === "object" && "toDate" in ts && typeof ts.toDate === "function") {
    return ts.toDate();
  }
  return new Date();
}

function formatValue(value: unknown, max = 120): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (str.length <= max) return str;
  return str.slice(0, max) + "\u2026";
}

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
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

// ---------------------------------------------------------------------------
// Flatten changelog docs into rows
// ---------------------------------------------------------------------------

interface ChangeRow {
  entity: string;
  entityType: string;
  field: string;
  changeType: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
  detectedBy: string;
}

function flattenDocs(docs: { ref: { path: string }; data: () => Record<string, unknown> }[]): ChangeRow[] {
  const rows: ChangeRow[] = [];

  for (const d of docs) {
    const data = d.data() as unknown as ChangelogDoc;
    const pathSegments = d.ref.path.split("/");
    const parentCollection = pathSegments[0] ?? "";
    const entitySlug = pathSegments[1] ?? "";
    const entityType = COLLECTION_TO_TYPE[parentCollection] ?? parentCollection;
    const ts = toDate(data.timestamp).toISOString();

    for (const change of data.changes ?? []) {
      rows.push({
        entity: entitySlug,
        entityType,
        field: change.field,
        changeType: change.changeType,
        oldValue: formatValue(change.oldValue),
        newValue: formatValue(change.newValue),
        timestamp: ts,
        detectedBy: data.detectedBy ?? "",
      });
    }
  }

  return rows;
}

const CSV_HEADERS = ["entity", "entityType", "field", "changeType", "oldValue", "newValue", "timestamp", "detectedBy"];

function toCSV(rows: ChangeRow[]): string {
  const lines: string[] = [CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(CSV_HEADERS.map((h) => escapeCSV(row[h as keyof ChangeRow])).join(","));
  }
  return lines.join("\n");
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
    const since = searchParams.get("since") || undefined;
    const typeFilter = searchParams.get("type") || undefined;

    if (format !== "json" && format !== "csv") {
      return NextResponse.json(
        { error: `Invalid format "${format}". Valid formats: json, csv` },
        { status: 400 },
      );
    }

    if (typeFilter && !VALID_TYPES.has(typeFilter)) {
      return NextResponse.json(
        { error: `Invalid type "${typeFilter}". Valid: ${Array.from(VALID_TYPES).join(", ")}` },
        { status: 400 },
      );
    }

    // Build query constraints
    const constraints: QueryConstraint[] = [orderBy("timestamp", "desc"), firestoreLimit(500)];

    if (since) {
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return NextResponse.json(
          { error: `Invalid date "${since}". Use YYYY-MM-DD format.` },
          { status: 400 },
        );
      }
      constraints.unshift(where("timestamp", ">=", Timestamp.fromDate(sinceDate)));
    }

    const q = query(collectionGroup(db, "changelog"), ...constraints);
    const snap = await getDocs(q);

    // Filter by type if needed (post-query since collectionGroup can't filter by parent)
    const filteredDocs = typeFilter
      ? snap.docs.filter((d) => {
          const parentCol = d.ref.path.split("/")[0] ?? "";
          return COLLECTION_TO_TYPE[parentCol] === typeFilter;
        })
      : snap.docs;

    const rows = flattenDocs(filteredDocs);
    const dateStr = getDateString();
    const rlHeaders = rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100);

    if (format === "csv") {
      return new NextResponse(toCSV(rows), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aaas-changelog-${dateStr}.csv"`,
          "Cache-Control": "public, max-age=300",
          ...rlHeaders,
        },
      });
    }

    // JSON (default)
    const body = JSON.stringify(
      {
        count: rows.length,
        since: since ?? null,
        type: typeFilter ?? null,
        timestamp: new Date().toISOString(),
        data: rows,
      },
      null,
      2,
    );

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aaas-changelog-${dateStr}.json"`,
        "Cache-Control": "public, max-age=300",
        ...rlHeaders,
      },
    });
  } catch (error) {
    console.error("[export/changelog] Error:", error);
    return NextResponse.json({ error: "Failed to export changelog" }, { status: 500 });
  }
}
