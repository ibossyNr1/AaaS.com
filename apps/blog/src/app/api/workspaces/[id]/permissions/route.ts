import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hasPermission, type Permission, type WorkspaceMember } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const VALID_PERMISSIONS = new Set<Permission>([
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
]);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workspaceId } = await params;
  const { searchParams } = req.nextUrl;
  const permission = searchParams.get("permission") as Permission | null;
  const userId = searchParams.get("userId");

  if (!permission || !VALID_PERMISSIONS.has(permission)) {
    return NextResponse.json(
      { error: "Invalid or missing 'permission' query parameter" },
      { status: 400 }
    );
  }

  if (!userId) {
    return NextResponse.json(
      { error: "Missing 'userId' query parameter" },
      { status: 400 }
    );
  }

  try {
    const memberRef = doc(db, "workspaces", workspaceId, "members", userId);
    const snap = await getDoc(memberRef);

    if (!snap.exists()) {
      return NextResponse.json(
        { allowed: false, role: null, error: "Not a workspace member" },
        { status: 200 }
      );
    }

    const member = snap.data() as WorkspaceMember;
    const allowed = hasPermission(member.role, permission);

    return NextResponse.json({
      allowed,
      role: member.role,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check permissions" },
      { status: 500 }
    );
  }
}
