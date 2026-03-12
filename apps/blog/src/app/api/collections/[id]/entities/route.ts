import { NextRequest, NextResponse } from "next/server";
import {
  getCollection,
  addToCollection,
  removeFromCollection,
  reorderCollection,
} from "@/lib/collections";
import { hasWorkspacePermission } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

// ── POST — Add entity to collection ──────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header." }, { status: 401 });
  }

  const { id } = params;

  try {
    const col = await getCollection(id);
    if (!col) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    }

    const hasPermission = await hasWorkspacePermission(userId, col.workspaceId, "editor");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions. Editor role required." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { entitySlug, entityType, note } = body;

    if (!entitySlug || !entityType) {
      return NextResponse.json(
        { error: "entitySlug and entityType are required." },
        { status: 400 },
      );
    }

    await addToCollection(id, { entitySlug, entityType, addedBy: userId, note });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to add entity to collection." }, { status: 500 });
  }
}

// ── DELETE — Remove entity from collection ───────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header." }, { status: 401 });
  }

  const { id } = params;

  try {
    const col = await getCollection(id);
    if (!col) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    }

    const hasPermission = await hasWorkspacePermission(userId, col.workspaceId, "editor");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions. Editor role required." },
        { status: 403 },
      );
    }

    const { searchParams } = req.nextUrl;
    const entitySlug = searchParams.get("entitySlug");
    const entityType = searchParams.get("entityType");

    if (!entitySlug || !entityType) {
      return NextResponse.json(
        { error: "entitySlug and entityType query params are required." },
        { status: 400 },
      );
    }

    await removeFromCollection(id, entitySlug, entityType);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove entity from collection." }, { status: 500 });
  }
}

// ── PUT — Reorder entities in collection ─────────────────────────────

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header." }, { status: 401 });
  }

  const { id } = params;

  try {
    const col = await getCollection(id);
    if (!col) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    }

    const hasPermission = await hasWorkspacePermission(userId, col.workspaceId, "editor");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions. Editor role required." },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { entityOrder } = body;

    if (!Array.isArray(entityOrder)) {
      return NextResponse.json(
        { error: "entityOrder must be an array of 'type:slug' strings." },
        { status: 400 },
      );
    }

    await reorderCollection(id, entityOrder);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to reorder collection." }, { status: 500 });
  }
}
