import { NextRequest, NextResponse } from "next/server";
import { getEntity } from "@/lib/entities";
import type { EntityType } from "@/lib/types";

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

    return NextResponse.json({
      data: entity,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch entity" }, { status: 500 });
  }
}
