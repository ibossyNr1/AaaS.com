/**
 * Role-Based Access Control (RBAC) Engine
 *
 * Defines permissions, roles, and hierarchy for workspace authorization.
 */

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Permission =
  | "read"
  | "write"
  | "delete"
  | "manage_members"
  | "manage_settings"
  | "manage_theme"
  | "manage_billing"
  | "manage_experiments"
  | "manage_integrations"
  | "view_analytics"
  | "export_data";

export type Role = "owner" | "admin" | "editor" | "viewer";

export type RolePermissions = Record<Role, Permission[]>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_PERMISSIONS: Permission[] = [
  "read",
  "write",
  "delete",
  "manage_members",
  "manage_settings",
  "manage_theme",
  "manage_billing",
  "manage_experiments",
  "manage_integrations",
  "view_analytics",
  "export_data",
];

export const ROLE_PERMISSIONS: RolePermissions = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS.filter((p) => p !== "manage_billing"),
  editor: ["read", "write", "view_analytics", "export_data"],
  viewer: ["read", "view_analytics"],
};

/** Ordered from most to least powerful. */
export const ROLE_HIERARCHY: Role[] = ["owner", "admin", "editor", "viewer"];

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function getAllPermissions(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

// ---------------------------------------------------------------------------
// Role hierarchy helpers
// ---------------------------------------------------------------------------

export function isRoleHigherOrEqual(a: Role, b: Role): boolean {
  return ROLE_HIERARCHY.indexOf(a) <= ROLE_HIERARCHY.indexOf(b);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  editor: "Editor",
  viewer: "Viewer",
};

const ROLE_BADGE_COLORS: Record<Role, string> = {
  owner: "text-accent-red border-accent-red/20 bg-accent-red/5",
  admin: "text-circuit border-circuit/20 bg-circuit/5",
  editor: "text-accent-teal border-accent-teal/20 bg-accent-teal/5",
  viewer: "text-text-muted border-border bg-surface",
};

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role];
}

export function getRoleBadgeColor(role: Role): string {
  return ROLE_BADGE_COLORS[role];
}

// ---------------------------------------------------------------------------
// Firestore-backed permission check
// ---------------------------------------------------------------------------

export interface WorkspaceMember {
  userId: string;
  role: Role;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

/**
 * Check whether a user has a specific permission within a workspace.
 * Reads the workspace member document from Firestore.
 */
export async function canPerformAction(
  userId: string,
  workspaceId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const memberRef = doc(db, "workspaces", workspaceId, "members", userId);
    const snap = await getDoc(memberRef);

    if (!snap.exists()) return false;

    const member = snap.data() as WorkspaceMember;
    return hasPermission(member.role, permission);
  } catch (err) {
    console.error("RBAC permission check failed:", err);
    return false;
  }
}
