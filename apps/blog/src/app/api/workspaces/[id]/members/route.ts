import { NextRequest, NextResponse } from "next/server";
import {
  getWorkspace,
  getWorkspaceMembers,
  addWorkspaceMember,
  removeWorkspaceMember,
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

    const members = await getWorkspaceMembers(workspace.id);
    return NextResponse.json({
      data: members,
      count: members.length,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}

export async function POST(
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
      return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, role, displayName, email } = body;

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: "targetUserId and role are required" },
        { status: 400 }
      );
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be admin, editor, or viewer" },
        { status: 400 }
      );
    }

    // Check member limit
    const currentMembers = await getWorkspaceMembers(workspace.id);
    if (currentMembers.length >= workspace.settings.maxMembers) {
      return NextResponse.json(
        { error: `Workspace member limit reached (${workspace.settings.maxMembers})` },
        { status: 409 }
      );
    }

    await addWorkspaceMember(workspace.id, {
      userId: targetUserId,
      workspaceId: workspace.id,
      role,
      displayName: displayName || "",
      email: email || "",
    });

    return NextResponse.json(
      { success: true, timestamp: new Date().toISOString() },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
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

    const hasPermission = await hasWorkspacePermission(userId, workspace.id, "admin");
    if (!hasPermission) {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
    }

    // Prevent removing the owner
    if (targetUserId === workspace.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove the workspace owner" },
        { status: 403 }
      );
    }

    await removeWorkspaceMember(workspace.id, targetUserId);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
