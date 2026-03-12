import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCollection } from "@/lib/collections";
import { hasWorkspacePermission } from "@/lib/workspaces";

export const dynamic = "force-dynamic";

// ── GET — Single collection with entities ─────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const col = await getCollection(id);
    if (!col) {
      return NextResponse.json({ error: "Collection not found." }, { status: 404 });
    }

    return NextResponse.json({ data: col });
  } catch {
    return NextResponse.json({ error: "Failed to fetch collection." }, { status: 500 });
  }
}

// ── PUT — Update collection metadata ──────────────────────────────────

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
    const { name, description, isPublic, tags, coverImage } = body;

    const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) update.name = name;
    if (description !== undefined) update.description = description;
    if (isPublic !== undefined) update.isPublic = isPublic;
    if (tags !== undefined) update.tags = tags;
    if (coverImage !== undefined) update.coverImage = coverImage;

    const ref = doc(db, "entity_collections", id);
    await updateDoc(ref, update);

    const updated = await getCollection(id);
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update collection." }, { status: 500 });
  }
}

// ── DELETE — Delete collection ────────────────────────────────────────

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

    const hasPermission = await hasWorkspacePermission(userId, col.workspaceId, "admin");
    if (!hasPermission) {
      return NextResponse.json(
        { error: "Insufficient permissions. Admin role required." },
        { status: 403 },
      );
    }

    await deleteDoc(doc(db, "entity_collections", id));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete collection." }, { status: 500 });
  }
}
