import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/entities";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import type { EntityType, Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_CATEGORIES = new Set(["all", "tool", "model", "agent", "skill", "script", "benchmark"]);

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

const CSV_HEADERS = [
  "rank",
  "name",
  "type",
  "provider",
  "composite",
  "adoption",
  "quality",
  "freshness",
  "citations",
  "engagement",
  "category",
  "slug",
] as const;

function toCSV(entries: { rank: number; entity: Entity }[]): string {
  const lines: string[] = [CSV_HEADERS.join(",")];
  for (const { rank, entity } of entries) {
    const row = [
      rank,
      entity.name,
      entity.type,
      entity.provider,
      entity.scores.composite,
      entity.scores.adoption,
      entity.scores.quality,
      entity.scores.freshness,
      entity.scores.citations,
      entity.scores.engagement,
      entity.category,
      entity.slug,
    ].map((v) => escapeCSV(v));
    lines.push(row.join(","));
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
    const category = searchParams.get("category") || "all";

    if (!VALID_CATEGORIES.has(category)) {
      return NextResponse.json(
        { error: `Invalid category "${category}". Valid: ${Array.from(VALID_CATEGORIES).join(", ")}` },
        { status: 400 },
      );
    }

    if (format !== "json" && format !== "csv") {
      return NextResponse.json(
        { error: `Invalid format "${format}". Valid formats: json, csv` },
        { status: 400 },
      );
    }

    const entities = await getLeaderboard(category as EntityType | "all", 100);
    const ranked = entities.map((entity, i) => ({ rank: i + 1, entity }));
    const dateStr = getDateString();
    const rlHeaders = rateLimitHeaders(rl.remaining ?? 0, rl.limit ?? 100);

    if (format === "csv") {
      return new NextResponse(toCSV(ranked), {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="aaas-leaderboard-${category}-${dateStr}.csv"`,
          "Cache-Control": "public, max-age=300",
          ...rlHeaders,
        },
      });
    }

    // JSON (default)
    const body = JSON.stringify(
      {
        category,
        count: ranked.length,
        timestamp: new Date().toISOString(),
        data: ranked.map(({ rank, entity }) => ({
          rank,
          name: entity.name,
          slug: entity.slug,
          type: entity.type,
          provider: entity.provider,
          category: entity.category,
          scores: entity.scores,
        })),
      },
      null,
      2,
    );

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="aaas-leaderboard-${category}-${dateStr}.json"`,
        "Cache-Control": "public, max-age=300",
        ...rlHeaders,
      },
    });
  } catch (error) {
    console.error("[export/leaderboard] Error:", error);
    return NextResponse.json({ error: "Failed to export leaderboard" }, { status: 500 });
  }
}
