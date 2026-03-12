import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

const COLLECTION_MAP: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

const ALL_TYPES = Object.keys(COLLECTION_MAP);

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function checkAuth(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key");
  const uid = req.headers.get("x-admin-uid");
  return !!(apiKey?.trim() || uid?.trim());
}

// ---------------------------------------------------------------------------
// Entity status derivation
// ---------------------------------------------------------------------------

function deriveStatus(data: Record<string, unknown>): "active" | "stale" | "broken" {
  const lastVerified = data.lastVerified as string | undefined;
  if (!lastVerified) return "broken";

  const daysSince = (Date.now() - new Date(lastVerified).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 30) return "stale";
  return "active";
}

// ---------------------------------------------------------------------------
// GET — List entities with pagination, filtering, sorting
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const typeFilter = params.get("type");
  const statusFilter = params.get("status");
  const sortField = params.get("sortField") || "compositeScore";
  const sortDir = (params.get("sortDir") || "desc") as "asc" | "desc";
  const page = Math.max(1, Number(params.get("page") || 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") || 25)));

  try {
    const types = typeFilter && COLLECTION_MAP[typeFilter] ? [typeFilter] : ALL_TYPES;

    // Fetch all matching entities
    const allEntities: Array<{
      slug: string;
      type: string;
      name: string;
      provider: string;
      compositeScore: number;
      schemaCompleteness: number;
      lastVerified: string | null;
      status: "active" | "stale" | "broken";
    }> = [];

    await Promise.all(
      types.map(async (type) => {
        const col = COLLECTION_MAP[type]!;
        const snap = await db.collection(col).get();

        for (const doc of snap.docs) {
          const data = doc.data();
          const status = deriveStatus(data);

          // Apply status filter
          if (statusFilter && statusFilter !== "all" && status !== statusFilter) continue;

          allEntities.push({
            slug: doc.id,
            type,
            name: (data.name as string) || doc.id,
            provider: (data.provider as string) || "",
            compositeScore: (data.scores as Record<string, number>)?.composite ?? 0,
            schemaCompleteness: (data.schemaCompleteness as number) ?? 0,
            lastVerified: (data.lastVerified as string) || null,
            status,
          });
        }
      }),
    );

    // Sort
    const firestoreFieldMap: Record<string, string> = {
      compositeScore: "compositeScore",
      schemaCompleteness: "schemaCompleteness",
      name: "name",
      type: "type",
      provider: "provider",
      lastVerified: "lastVerified",
      status: "status",
    };

    const field = firestoreFieldMap[sortField] || "compositeScore";
    const dir = sortDir === "asc" ? 1 : -1;

    allEntities.sort((a, b) => {
      const av = (a as Record<string, unknown>)[field];
      const bv = (b as Record<string, unknown>)[field];

      if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
      if (typeof av === "string" && typeof bv === "string") return av.localeCompare(bv) * dir;
      if (av == null && bv != null) return dir;
      if (av != null && bv == null) return -dir;
      return 0;
    });

    // Paginate
    const total = allEntities.length;
    const start = (page - 1) * pageSize;
    const entities = allEntities.slice(start, start + pageSize);

    return NextResponse.json({ entities, total, page, pageSize });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Delete an entity by type + slug
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const type = params.get("type");
  const slug = params.get("slug");

  if (!type || !slug || !COLLECTION_MAP[type]) {
    return NextResponse.json({ error: "Missing or invalid type/slug parameters." }, { status: 400 });
  }

  try {
    const col = COLLECTION_MAP[type]!;
    const docRef = db.collection(col).doc(slug);
    const snap = await docRef.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Entity not found." }, { status: 404 });
    }

    await docRef.delete();

    return NextResponse.json({
      message: `Deleted ${type}/${slug}.`,
      type,
      slug,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — Update entity fields or trigger actions
// ---------------------------------------------------------------------------

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const type = body.type as string | undefined;
  const slug = body.slug as string | undefined;

  if (!type || !slug || !COLLECTION_MAP[type]) {
    return NextResponse.json({ error: "Missing or invalid type/slug in body." }, { status: 400 });
  }

  const col = COLLECTION_MAP[type]!;
  const docRef = db.collection(col).doc(slug);

  try {
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Entity not found." }, { status: 404 });
    }

    // Action-based updates (re-verify, enrich)
    const action = body.action as string | undefined;
    if (action === "re-verify") {
      await docRef.update({
        lastVerified: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
      return NextResponse.json({ message: `Re-verified ${type}/${slug}.` });
    }

    if (action === "enrich") {
      // Write to enrichment queue for agents to pick up
      await db.collection("enrichment_queue").add({
        entityType: type,
        entitySlug: slug,
        requestedAt: new Date().toISOString(),
        status: "pending",
      });
      return NextResponse.json({ message: `Enrichment queued for ${type}/${slug}.` });
    }

    // Direct field update
    const fields = body.fields as Record<string, unknown> | undefined;
    if (!fields || Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields or action provided." }, { status: 400 });
    }

    // Prevent overwriting protected fields
    const protectedFields = new Set(["slug", "type"]);
    const safeFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (!protectedFields.has(key)) {
        safeFields[key] = value;
      }
    }

    safeFields.lastUpdated = new Date().toISOString();
    await docRef.update(safeFields);

    return NextResponse.json({
      message: `Updated ${type}/${slug}.`,
      updatedFields: Object.keys(safeFields),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
