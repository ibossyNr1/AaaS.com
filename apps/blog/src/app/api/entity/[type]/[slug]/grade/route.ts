export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getEntity } from "@/lib/entities";
import type { EntityType } from "@/lib/types";
import { computeDetailedGrades } from "@/lib/grades";

const VALID_TYPES = new Set(["tool", "model", "agent", "skill", "script", "benchmark"]);

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string; slug: string } }
) {
  const { type, slug } = params;

  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: `Invalid entity type: ${type}` }, { status: 400 });
  }

  try {
    const entity = await getEntity(type as EntityType, slug);
    if (!entity) {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }

    const { overall, dimensions } = computeDetailedGrades(entity.scores);

    return NextResponse.json(
      {
        overall,
        dimensions,
        composite: entity.scores.composite,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=300",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to compute grades" }, { status: 500 });
  }
}
