import { NextRequest, NextResponse } from "next/server";
import { getRecentEvents, ALL_EVENT_TYPES } from "@/lib/events";
import type { IndexEventType } from "@/lib/events";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET — List recent events with optional type filter
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const typeParam = searchParams.get("type");
  const limitParam = searchParams.get("limit");

  // Validate type filter
  let typeFilter: IndexEventType | undefined;
  if (typeParam) {
    if (!ALL_EVENT_TYPES.includes(typeParam as IndexEventType)) {
      return NextResponse.json(
        {
          error: `Invalid event type: ${typeParam}. Allowed: ${ALL_EVENT_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }
    typeFilter = typeParam as IndexEventType;
  }

  // Parse limit (default 50, max 200)
  const limit = Math.min(Math.max(parseInt(limitParam ?? "50", 10) || 50, 1), 200);

  try {
    const events = await getRecentEvents(limit, typeFilter);

    return NextResponse.json(
      { events, count: events.length },
      {
        status: 200,
        headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
