import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export const dynamic = "force-dynamic";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function authenticateRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    return await getAuth().verifyIdToken(token);
  } catch {
    return null;
  }
}

async function isWorkspaceAdmin(
  workspaceId: string,
  uid: string,
): Promise<boolean> {
  const memberRef = db
    .collection("workspaces")
    .doc(workspaceId)
    .collection("members")
    .doc(uid);
  const snap = await memberRef.get();
  if (!snap.exists) return false;
  const role = snap.data()?.role;
  return role === "admin" || role === "owner";
}

// ---------------------------------------------------------------------------
// GET — Retrieve workspace theme
// ---------------------------------------------------------------------------

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  try {
    const themeRef = db
      .collection("workspaces")
      .doc(id)
      .collection("settings")
      .doc("theme");
    const snap = await themeRef.get();

    if (!snap.exists) {
      return NextResponse.json({ theme: null });
    }

    return NextResponse.json({ theme: snap.data() });
  } catch (err) {
    console.error("[workspace-theme] GET error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve theme." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT — Update workspace theme (admin+ only)
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params;

  // Auth check
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Admin check
  const admin = await isWorkspaceAdmin(id, user.uid);
  if (!admin) {
    return NextResponse.json(
      { error: "Forbidden. Admin role required." },
      { status: 403 },
    );
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const theme = body.theme;
  if (!theme || typeof theme !== "object") {
    return NextResponse.json(
      { error: "Missing `theme` object in body." },
      { status: 400 },
    );
  }

  try {
    const themeRef = db
      .collection("workspaces")
      .doc(id)
      .collection("settings")
      .doc("theme");

    await themeRef.set(
      { ...theme, updatedAt: new Date().toISOString(), updatedBy: user.uid },
      { merge: true },
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[workspace-theme] PUT error:", err);
    return NextResponse.json(
      { error: "Failed to save theme." },
      { status: 500 },
    );
  }
}
