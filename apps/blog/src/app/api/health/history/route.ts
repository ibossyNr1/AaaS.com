import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const daysParam = parseInt(searchParams.get("days") ?? "7", 10);
    const days = Math.min(Math.max(daysParam, 1), 30);

    // Fetch history documents (one per day, named history_YYYY-MM-DD)
    const snap = await getDocs(
      query(
        collection(db, "health_checks"),
        orderBy("__name__", "desc"),
        limit(days + 1), // +1 to account for "latest" doc
      ),
    );

    const history: Array<{
      date: string;
      checks: Array<{
        overallScore: number;
        overallStatus: string;
        components: Array<{ name: string; score: number; status: string }>;
        timestamp: string;
      }>;
    }> = [];

    for (const doc of snap.docs) {
      if (!doc.id.startsWith("history_")) continue;
      const data = doc.data();
      history.push({
        date: (data.date as string) ?? doc.id.replace("history_", ""),
        checks: (data.checks as Array<{
          overallScore: number;
          overallStatus: string;
          components: Array<{ name: string; score: number; status: string }>;
          timestamp: string;
        }>) ?? [],
      });
    }

    // Sort by date descending and limit
    history.sort((a, b) => b.date.localeCompare(a.date));
    const trimmed = history.slice(0, days);

    return NextResponse.json(
      { days, history: trimmed },
      { headers: { "Cache-Control": "no-cache" } },
    );
  } catch (err) {
    console.error("[api/health/history] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch health history" },
      { status: 500, headers: { "Cache-Control": "no-cache" } },
    );
  }
}
