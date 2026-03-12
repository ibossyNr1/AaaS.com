import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}
const db = getFirestore();

// ---------------------------------------------------------------------------
// GET — List submissions, optionally filtered by status
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: "Missing or empty x-api-key header." },
      { status: 401 },
    );
  }

  const statusFilter = req.nextUrl.searchParams.get("status") ?? "pending";

  try {
    let q: FirebaseFirestore.Query = db.collection("submissions");

    if (statusFilter !== "all") {
      q = q.where("status", "==", statusFilter);
    }

    q = q.orderBy("submittedAt", "desc").limit(50);

    const snap = await q.get();

    const submissions = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ submissions }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
