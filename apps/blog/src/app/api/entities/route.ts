import { NextRequest, NextResponse } from "next/server";
import { getTrendingEntities, getEntitiesByType, getEntitiesByChannel } from "@/lib/entities";
import type { EntityType } from "@/lib/types";

const VALID_TYPES = new Set(["tool", "model", "agent", "skill", "script", "benchmark"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const type = searchParams.get("type");
  const channel = searchParams.get("channel");
  const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

  try {
    let entities;
    if (type && VALID_TYPES.has(type)) {
      entities = await getEntitiesByType(type as EntityType, limit);
    } else if (channel) {
      entities = await getEntitiesByChannel(channel, limit);
    } else {
      entities = await getTrendingEntities(limit);
    }

    return NextResponse.json({
      data: entities,
      count: entities.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
  }
}
