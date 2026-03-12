import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const q = query(
      collection(db, "trending_alerts"),
      orderBy("detectedAt", "desc"),
      limit(20),
    );

    const snap = await getDocs(q);
    const alerts = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(alerts, {
      headers: {
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("[api/trending] Error fetching trending alerts:", err);
    return NextResponse.json(
      { error: "Failed to fetch trending alerts" },
      { status: 500 },
    );
  }
}
