import { NextRequest, NextResponse } from "next/server";
import { getCollections, getPublicCollections, createCollection } from "@/lib/collections";
import { hasWorkspacePermission } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

// ── GET — List collections (workspace or public) ──────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const workspaceId = searchParams.get("workspaceId");
  const limit = Math.min(Number(searchParams.get("limit") || 20), 100);

  try {
    let collections;
    if (workspaceId) {
      collections = await getCollections(workspaceId);
    } else {
      collections = await getPublicCollections(limit);
    }

    return NextResponse.json({
      data: collections,
      count: collections.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

// ── POST — Create a collection ────────────────────────────────────────

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { workspaceId, name, description, slug, isPublic, tags, coverImage } = body;

    if (!workspaceId || !name || !slug) {
      return NextResponse.json(
        { error: "workspaceId, name, and slug are required." },
        { status: 400 },
      );
    }

    // Verify editor+ permission
    const hasPermission = await hasWorkspacePermission(userId, workspaceId, "editor");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions. Editor role required." },
        { status: 403 },
      );
    }

    const created = await createCollection({
      workspaceId,
      name,
      description: description || "",
      slug,
      entities: [],
      isPublic: isPublic ?? false,
      createdBy: userId,
      tags: tags || [],
      coverImage,
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create collection." }, { status: 500 });
  }
}
