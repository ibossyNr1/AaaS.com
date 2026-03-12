import { NextRequest, NextResponse } from "next/server";
import { getUserBookmarks, toggleBookmark } from "@/lib/collections";

export const dynamic = "force-dynamic";

// ── GET — List user's bookmarks ───────────────────────────────────────

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header." }, { status: 401 });
  }

  try {
    const bookmarks = await getUserBookmarks(userId);
    return NextResponse.json({
      data: bookmarks,
      count: bookmarks.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch bookmarks." }, { status: 500 });
  }
}

// ── POST — Toggle bookmark ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { entitySlug, entityType } = body;

    if (!entitySlug || !entityType) {
      return NextResponse.json(
        { error: "entitySlug and entityType are required." },
        { status: 400 },
      );
    }

    const isBookmarked = await toggleBookmark(userId, entitySlug, entityType);
    return NextResponse.json({
      bookmarked: isBookmarked,
      entitySlug,
      entityType,
    });
  } catch {
    return NextResponse.json({ error: "Failed to toggle bookmark." }, { status: 500 });
  }
}
