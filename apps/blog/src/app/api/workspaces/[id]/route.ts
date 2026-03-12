import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  hasWorkspacePermission,
} from "@/lib/workspaces";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({ data: workspace, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const { id } = params;

  try {
    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const hasPermission = await hasWorkspacePermission(userId, workspace.id, "admin");
    if (!hasPermission) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    // Prevent changing ownerId or id through update
    delete body.id;
    delete body.ownerId;

    const updated = await updateWorkspace(workspace.id, body);
    return NextResponse.json({ data: updated, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Failed to update workspace" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = req.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const { id } = params;

  try {
    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Only owners can delete workspaces
    const isOwner = await hasWorkspacePermission(userId, workspace.id, "owner");
    if (!isOwner) {
      return NextResponse.json({ error: "Only workspace owners can delete workspaces" }, { status: 403 });
    }

    await deleteWorkspace(workspace.id);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Failed to delete workspace" }, { status: 500 });
  }
}
