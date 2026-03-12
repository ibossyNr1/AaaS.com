import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Types ──────────────────────────────────────────────────────────────

export interface WorkspaceTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export interface WorkspaceSettings {
  isPublic: boolean;
  allowSubmissions: boolean;
  customDomain?: string;
  defaultDigestFrequency: string;
  maxMembers: number;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  theme?: WorkspaceTheme;
  ownerId: string;
  plan: "free" | "team" | "enterprise";
  createdAt: string;
  updatedAt: string;
  settings: WorkspaceSettings;
}

export interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: string;
  displayName: string;
  email: string;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired";
}

// ── Role hierarchy ─────────────────────────────────────────────────────

const ROLE_LEVELS: Record<WorkspaceMember["role"], number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

// ── Collections ────────────────────────────────────────────────────────

const WORKSPACES_COL = "workspaces";
const MEMBERS_COL = "workspace_members";
const INVITES_COL = "workspace_invites";

// ── Workspace CRUD ─────────────────────────────────────────────────────

export async function getWorkspace(idOrSlug: string): Promise<Workspace | null> {
  // Try direct ID lookup first
  const ref = doc(db, WORKSPACES_COL, idOrSlug);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as Workspace;
  }

  // Fall back to slug query
  const q = query(collection(db, WORKSPACES_COL), where("slug", "==", idOrSlug));
  const slugSnap = await getDocs(q);
  if (slugSnap.empty) return null;
  const d = slugSnap.docs[0];
  return { id: d.id, ...d.data() } as Workspace;
}

export async function getUserWorkspaces(
  userId: string
): Promise<(Workspace & { role: WorkspaceMember["role"] })[]> {
  // Get all memberships for this user
  const membersQ = query(
    collection(db, MEMBERS_COL),
    where("userId", "==", userId),
    orderBy("joinedAt", "desc")
  );
  const memberSnap = await getDocs(membersQ);

  const results: (Workspace & { role: WorkspaceMember["role"] })[] = [];

  await Promise.all(
    memberSnap.docs.map(async (memberDoc) => {
      const member = memberDoc.data() as WorkspaceMember;
      const wsRef = doc(db, WORKSPACES_COL, member.workspaceId);
      const wsSnap = await getDoc(wsRef);
      if (wsSnap.exists()) {
        results.push({
          id: wsSnap.id,
          ...wsSnap.data(),
          role: member.role,
        } as Workspace & { role: WorkspaceMember["role"] });
      }
    })
  );

  return results;
}

export async function createWorkspace(
  data: Omit<Workspace, "id" | "createdAt" | "updatedAt">
): Promise<Workspace> {
  const now = new Date().toISOString();
  const ref = doc(collection(db, WORKSPACES_COL));
  const workspace: Workspace = {
    ...data,
    id: ref.id,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, workspace);

  // Auto-add creator as owner member
  await addWorkspaceMember(ref.id, {
    userId: data.ownerId,
    workspaceId: ref.id,
    role: "owner",
    displayName: "",
    email: "",
  });

  return workspace;
}

export async function updateWorkspace(
  id: string,
  patch: Partial<Workspace>
): Promise<Workspace> {
  const ref = doc(db, WORKSPACES_COL, id);
  const update = { ...patch, updatedAt: new Date().toISOString() };
  // Remove id from patch to avoid overwriting document id
  delete update.id;
  await updateDoc(ref, update);

  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() } as Workspace;
}

export async function deleteWorkspace(id: string): Promise<void> {
  // Delete all members first
  const membersQ = query(collection(db, MEMBERS_COL), where("workspaceId", "==", id));
  const memberSnap = await getDocs(membersQ);
  await Promise.all(memberSnap.docs.map((d) => deleteDoc(d.ref)));

  // Delete all invites
  const invitesQ = query(collection(db, INVITES_COL), where("workspaceId", "==", id));
  const inviteSnap = await getDocs(invitesQ);
  await Promise.all(inviteSnap.docs.map((d) => deleteDoc(d.ref)));

  // Delete the workspace
  await deleteDoc(doc(db, WORKSPACES_COL, id));
}

// ── Members ────────────────────────────────────────────────────────────

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const q = query(
    collection(db, MEMBERS_COL),
    where("workspaceId", "==", workspaceId),
    orderBy("joinedAt", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as WorkspaceMember);
}

export async function addWorkspaceMember(
  workspaceId: string,
  member: Omit<WorkspaceMember, "joinedAt">
): Promise<void> {
  const docId = `${workspaceId}_${member.userId}`;
  const ref = doc(db, MEMBERS_COL, docId);
  await setDoc(ref, {
    ...member,
    workspaceId,
    joinedAt: new Date().toISOString(),
  });
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  const docId = `${workspaceId}_${userId}`;
  await deleteDoc(doc(db, MEMBERS_COL, docId));
}

// ── Permissions ────────────────────────────────────────────────────────

export async function hasWorkspacePermission(
  userId: string,
  workspaceId: string,
  requiredRole: WorkspaceMember["role"]
): Promise<boolean> {
  const docId = `${workspaceId}_${userId}`;
  const ref = doc(db, MEMBERS_COL, docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return false;
  const member = snap.data() as WorkspaceMember;
  return ROLE_LEVELS[member.role] >= ROLE_LEVELS[requiredRole];
}

export async function getMemberRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceMember["role"] | null> {
  const docId = `${workspaceId}_${userId}`;
  const ref = doc(db, MEMBERS_COL, docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return (snap.data() as WorkspaceMember).role;
}
