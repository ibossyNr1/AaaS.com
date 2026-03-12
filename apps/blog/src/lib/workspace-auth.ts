/**
 * Workspace Authorization Helpers
 *
 * Server-side utilities for API route authorization.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  hasPermission,
  type Permission,
  type Workspace,
  type WorkspaceMember,
} from "@/lib/rbac";
import { type NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class WorkspaceAuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403
  ) {
    super(message);
    this.name = "WorkspaceAuthError";
  }
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Require that a user has a specific permission in a workspace.
 * Throws a `WorkspaceAuthError` if unauthorized.
 */
export async function requireWorkspaceAuth(
  userId: string,
  workspaceId: string,
  permission: Permission
): Promise<{ member: WorkspaceMember; workspace: Workspace }> {
  // Fetch workspace
  const workspaceRef = doc(db, "workspaces", workspaceId);
  const workspaceSnap = await getDoc(workspaceRef);

  if (!workspaceSnap.exists()) {
    throw new WorkspaceAuthError("Workspace not found", 404);
  }

  const workspace = {
    id: workspaceSnap.id,
    ...workspaceSnap.data(),
  } as Workspace;

  // Fetch member
  const memberRef = doc(db, "workspaces", workspaceId, "members", userId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists()) {
    throw new WorkspaceAuthError("Not a member of this workspace", 403);
  }

  const member = memberSnap.data() as WorkspaceMember;

  // Check permission
  if (!hasPermission(member.role, permission)) {
    throw new WorkspaceAuthError(
      `Insufficient permissions: requires '${permission}'`,
      403
    );
  }

  return { member, workspace };
}

/**
 * Extract workspace context from a request.
 * Looks for `x-workspace-id` header and `x-user-id` header.
 * Returns null if either is missing.
 */
export function getWorkspaceFromRequest(
  req: NextRequest
): { workspaceId: string; userId: string } | null {
  const workspaceId = req.headers.get("x-workspace-id");
  const userId = req.headers.get("x-user-id");

  if (!workspaceId || !userId) return null;

  return { workspaceId, userId };
}
