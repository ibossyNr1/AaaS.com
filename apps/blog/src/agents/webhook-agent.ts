/**
 * Webhook Delivery Agent
 *
 * Processes pending items from the Firestore `webhook_queue` collection,
 * delivers them via HTTP POST, and handles retries with exponential backoff.
 *
 * Run standalone:   npx tsx src/agents/webhook-agent.ts
 * Via runner:       npx tsx src/agents/runner.ts webhook
 */

import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { createHmac } from "crypto";
import { logAgentAction } from "./logger";

// ---------------------------------------------------------------------------
// Firebase Admin init
// ---------------------------------------------------------------------------

if (getApps().length === 0) {
  initializeApp({ projectId: "aaas-platform" });
}

const db = getFirestore();

const AGENT_NAME = "webhook";
const MAX_DELIVERIES_PER_RUN = 20;
const MAX_ATTEMPTS = 3;

// Exponential backoff schedule (in minutes)
const RETRY_DELAYS_MIN = [1, 5, 30];

// ---------------------------------------------------------------------------
// Types (mirrors src/lib/webhooks.ts — using plain objects to avoid client SDK)
// ---------------------------------------------------------------------------

interface QueueItem {
  subscriptionId: string;
  url: string;
  secret: string;
  payload: {
    event: string;
    timestamp: string;
    data: Record<string, unknown>;
  };
  attempts: number;
  retryAfter?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

function signPayload(payload: Record<string, unknown>, secret: string): string {
  const body = JSON.stringify(payload);
  return createHmac("sha256", secret).update(body).digest("hex");
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

async function deliverWebhook(
  docId: string,
  item: QueueItem,
): Promise<boolean> {
  const signature = signPayload(item.payload as unknown as Record<string, unknown>, item.secret);

  try {
    const res = await fetch(item.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body: JSON.stringify(item.payload),
      signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    if (res.ok) {
      // Success — remove from queue and update subscription
      await db.doc(`webhook_queue/${docId}`).delete();
      await db.doc(`webhooks/${item.subscriptionId}`).update({
        lastDelivery: new Date().toISOString(),
      });

      console.log(`  [OK]   ${item.payload.event} -> ${item.url}`);
      return true;
    }

    // Non-2xx response
    console.warn(
      `  [FAIL] ${item.payload.event} -> ${item.url} (HTTP ${res.status})`,
    );
    return false;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`  [FAIL] ${item.payload.event} -> ${item.url} (${message})`);
    return false;
  }
}

async function handleFailure(docId: string, item: QueueItem): Promise<void> {
  const newAttempts = item.attempts + 1;

  if (newAttempts >= MAX_ATTEMPTS) {
    // Max retries exhausted — remove from queue and deactivate subscription
    await db.doc(`webhook_queue/${docId}`).delete();
    await db.doc(`webhooks/${item.subscriptionId}`).update({
      active: false,
      failureCount: FieldValue.increment(1),
    });

    console.error(
      `  [DEAD] Subscription ${item.subscriptionId} deactivated after ${MAX_ATTEMPTS} failures`,
    );

    await logAgentAction(
      AGENT_NAME,
      "subscription_deactivated",
      {
        subscriptionId: item.subscriptionId,
        url: item.url,
        event: item.payload.event,
        attempts: newAttempts,
      },
      false,
      `Webhook subscription deactivated after ${MAX_ATTEMPTS} failed delivery attempts`,
    );

    return;
  }

  // Schedule retry with exponential backoff
  const delayMinutes = RETRY_DELAYS_MIN[newAttempts - 1] ?? 30;
  const retryAfter = new Date(Date.now() + delayMinutes * 60_000).toISOString();

  await db.doc(`webhook_queue/${docId}`).update({
    attempts: newAttempts,
    retryAfter,
  });

  console.log(
    `  [RETRY] Attempt ${newAttempts}/${MAX_ATTEMPTS} — retry after ${delayMinutes}min`,
  );
}

// ---------------------------------------------------------------------------
// Main run loop
// ---------------------------------------------------------------------------

export async function run(): Promise<void> {
  console.log("Webhook Delivery Agent");
  console.log("----------------------");

  const now = new Date().toISOString();

  // Fetch pending items: no retryAfter or retryAfter in the past
  const queueSnap = await db
    .collection("webhook_queue")
    .orderBy("createdAt", "asc")
    .limit(MAX_DELIVERIES_PER_RUN * 2) // fetch extra to filter retryAfter
    .get();

  // Filter to items that are ready to deliver
  const readyItems: { id: string; data: QueueItem }[] = [];
  for (const doc of queueSnap.docs) {
    if (readyItems.length >= MAX_DELIVERIES_PER_RUN) break;

    const data = doc.data() as QueueItem;
    if (!data.retryAfter || data.retryAfter <= now) {
      readyItems.push({ id: doc.id, data });
    }
  }

  if (readyItems.length === 0) {
    console.log("No pending webhook deliveries.");
    await logAgentAction(AGENT_NAME, "run", { delivered: 0, failed: 0 }, true);
    return;
  }

  console.log(`Processing ${readyItems.length} pending deliveries...\n`);

  let delivered = 0;
  let failed = 0;

  for (const { id, data } of readyItems) {
    const success = await deliverWebhook(id, data);

    if (success) {
      delivered++;
    } else {
      failed++;
      await handleFailure(id, data);
    }
  }

  console.log(`\nDelivered: ${delivered} | Failed: ${failed}`);

  await logAgentAction(
    AGENT_NAME,
    "run",
    { delivered, failed, total: readyItems.length },
    failed === 0,
    failed > 0 ? `${failed} delivery failures` : undefined,
  );
}

// ---------------------------------------------------------------------------
// Standalone execution
// ---------------------------------------------------------------------------

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Webhook agent crashed:", err);
      process.exit(1);
    });
}
