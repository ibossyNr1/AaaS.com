import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// Admin UID management
// ---------------------------------------------------------------------------

/** Comma-separated fallback admin UIDs from environment */
const ADMIN_UIDS: string[] = (process.env.ADMIN_UIDS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export { ADMIN_UIDS };

/**
 * Check if a UID is an admin.
 * First checks the `admin_users` Firestore collection, then falls back to
 * the ADMIN_UIDS env var list.
 */
export async function isAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;

  // Fast path — env var list
  if (ADMIN_UIDS.includes(uid)) return true;

  // Firestore check
  try {
    const snap = await db.collection("admin_users").doc(uid).get();
    return snap.exists;
  } catch {
    return false;
  }
}

/**
 * Throws a 403 error if the UID is not an admin.
 */
export async function requireAdmin(uid: string): Promise<void> {
  const admin = await isAdmin(uid);
  if (!admin) {
    const err = new Error("Forbidden: admin access required.");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Auth extraction helpers for API routes
// ---------------------------------------------------------------------------

/**
 * Extract admin identity from a request.
 * Supports `x-api-key` header or `x-admin-uid` header.
 * Returns the UID string or null if not authenticated.
 */
export async function getAdminUid(
  headers: Headers,
): Promise<string | null> {
  // API key auth — treat the key itself as the UID for simplicity
  const apiKey = headers.get("x-api-key");
  if (apiKey && apiKey.trim().length > 0) {
    return apiKey.trim();
  }

  // UID header (e.g. from authenticated frontend)
  const uid = headers.get("x-admin-uid");
  if (uid && uid.trim().length > 0) {
    return uid.trim();
  }

  return null;
}

/**
 * Validate a request has admin access. Returns the admin UID or a
 * NextResponse-compatible error object.
 */
export async function validateAdmin(
  headers: Headers,
): Promise<{ uid: string } | { error: string; status: number }> {
  const uid = await getAdminUid(headers);
  if (!uid) {
    return { error: "Missing authentication. Provide x-api-key or x-admin-uid header.", status: 401 };
  }

  const admin = await isAdmin(uid);
  if (!admin) {
    return { error: "Forbidden: admin access required.", status: 403 };
  }

  return { uid };
}

export { db };
