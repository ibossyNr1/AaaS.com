import { NextResponse } from "next/server";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET — Server-Sent Events stream for real-time event notifications
// ---------------------------------------------------------------------------

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Track the last event timestamp we sent
      let lastTimestamp = Timestamp.now();

      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      }

      // Send initial keepalive
      send("connected", { message: "Stream connected", timestamp: new Date().toISOString() });

      // Poll every 5 seconds for new events
      const interval = setInterval(async () => {
        try {
          const q = query(
            collection(db, "event_log"),
            where("createdAt", ">", lastTimestamp),
            orderBy("createdAt", "asc"),
            limit(50),
          );

          const snap = await getDocs(q);

          if (!snap.empty) {
            for (const doc of snap.docs) {
              const d = doc.data();
              send("event", {
                id: doc.id,
                type: d.type,
                entityType: d.entityType,
                slug: d.slug,
                data: d.data ?? {},
                timestamp: d.timestamp,
              });
            }
            // Update cursor to the last doc's createdAt
            const lastDoc = snap.docs[snap.docs.length - 1];
            lastTimestamp = lastDoc.data().createdAt;
          }

          // Send keepalive to prevent connection timeout
          send("heartbeat", { timestamp: new Date().toISOString() });
        } catch {
          send("error", { message: "Failed to poll events" });
        }
      }, 5000);

      // Clean up when client disconnects
      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      // Auto-close after 5 minutes to prevent resource leaks
      setTimeout(cleanup, 5 * 60 * 1000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
    },
  });
}
