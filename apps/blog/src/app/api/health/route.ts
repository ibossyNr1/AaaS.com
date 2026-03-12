import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const snap = await getDoc(doc(db, "health_checks", "latest"));

    if (!snap.exists()) {
      return NextResponse.json(
        {
          overallScore: 0,
          overallStatus: "unknown",
          components: [],
          lastCheck: null,
          message: "No health check data available yet.",
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-cache" },
        },
      );
    }

    const data = snap.data();
    const score = (data.overallScore as number) ?? 0;
    const status = score >= 70 ? 200 : 503;

    return NextResponse.json(
      {
        overallScore: data.overallScore,
        overallStatus: data.overallStatus,
        components: data.components ?? [],
        lastCheck: data.timestamp ?? null,
      },
      {
        status,
        headers: { "Cache-Control": "no-cache" },
      },
    );
  } catch (err) {
    console.error("[api/health] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch health status" },
      { status: 500, headers: { "Cache-Control": "no-cache" } },
    );
  }
}
