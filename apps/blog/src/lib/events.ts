/**
 * Event System — Index Events & Webhook Queue
 *
 * Defines the event types emitted by the AaaS Knowledge Index,
 * writes events to the `event_log` Firestore collection, and
 * queues webhook deliveries in the `webhook_queue` collection.
 */

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IndexEventType =
  | "entity.created"
  | "entity.updated"
  | "entity.deleted"
  | "score.changed"
  | "submission.approved"
  | "submission.rejected"
  | "digest.published"
  | "trending.alert";

export const ALL_EVENT_TYPES: IndexEventType[] = [
  "entity.created",
  "entity.updated",
  "entity.deleted",
  "score.changed",
  "submission.approved",
  "submission.rejected",
  "digest.published",
  "trending.alert",
];

export interface IndexEvent {
  id?: string;
  type: IndexEventType;
  entityType?: string;
  slug?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Emit — writes to event_log and webhook_queue
// ---------------------------------------------------------------------------

/**
 * Emit an index event.
 *
 * 1. Writes the event to the `event_log` collection for history/streaming.
 * 2. Finds all active webhook subscriptions that match the event type and
 *    enqueues a delivery for each.
 */
export async function emitEvent(
  event: Omit<IndexEvent, "id" | "timestamp">,
): Promise<string> {
  const timestamp = new Date().toISOString();

  const doc = {
    ...event,
    timestamp,
    createdAt: Timestamp.now(),
  };

  // Write to event_log
  const ref = await addDoc(collection(db, "event_log"), doc);

  // Find matching webhook subscriptions and queue deliveries
  try {
    const subsQuery = query(
      collection(db, "webhooks"),
      where("active", "==", true),
      where("events", "array-contains", event.type),
    );
    const snap = await getDocs(subsQuery);

    for (const sub of snap.docs) {
      const data = sub.data();
      await addDoc(collection(db, "webhook_queue"), {
        subscriptionId: sub.id,
        url: data.url,
        secret: data.secret,
        payload: { event: event.type, timestamp, data: event.data },
        attempts: 0,
        createdAt: timestamp,
        eventId: ref.id,
      });
    }
  } catch {
    // Webhook queue failures should not block event logging
  }

  return ref.id;
}

// ---------------------------------------------------------------------------
// Read — recent events
// ---------------------------------------------------------------------------

/**
 * Fetch recent events from the `event_log` collection.
 */
export async function getRecentEvents(
  limit: number = 50,
  typeFilter?: IndexEventType,
): Promise<IndexEvent[]> {
  const constraints: QueryConstraint[] = [];

  if (typeFilter) {
    constraints.push(where("type", "==", typeFilter));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(firestoreLimit(limit));

  const q = query(collection(db, "event_log"), ...constraints);
  const snap = await getDocs(q);

  return snap.docs.map((doc) => ({
    id: doc.id,
    type: doc.data().type,
    entityType: doc.data().entityType,
    slug: doc.data().slug,
    data: doc.data().data ?? {},
    timestamp: doc.data().timestamp,
  }));
}
