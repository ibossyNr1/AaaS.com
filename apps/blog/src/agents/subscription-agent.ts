/**
 * Subscription Notification Agent
 *
 * Reads the `subscriptions` collection, checks what entities and channels
 * each subscriber follows, generates personalized notification payloads,
 * and writes them to `webhook_queue` for delivery by the webhook agent.
 *
 * Schedule: weekly (supplemental — runs before digest)
 * Idempotent: yes — skips if notifications for the current week already exist
 */

import { db, logAgentAction } from "./logger";

const AGENT_NAME = "subscription-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

interface SubscriptionDoc {
  plan: string;
  channels: string[];
  digestFrequency: string;
  alertPreferences: {
    entityAlerts: boolean;
    channelAlerts: boolean;
    weeklyDigest: boolean;
    trendingAlerts: boolean;
  };
}

interface NotificationPayload {
  userId: string;
  type: "channel_update" | "entity_change" | "trending" | "digest_ready";
  title: string;
  body: string;
  entities?: { name: string; type: string; slug: string }[];
  channel?: string;
}

function getWeekKey(): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return weekAgo.toISOString().split("T")[0];
}

async function getNewEntitiesForChannels(
  channels: string[],
  cutoff: Date,
): Promise<Map<string, { name: string; type: string; slug: string }[]>> {
  const result = new Map<string, { name: string; type: string; slug: string }[]>();

  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db
      .collection(col)
      .where("addedDate", ">=", cutoff.toISOString())
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      const entityChannels: string[] = data.channels || [];

      for (const ch of entityChannels) {
        if (!channels.includes(ch)) continue;
        if (!result.has(ch)) result.set(ch, []);
        result.get(ch)!.push({
          name: data.name || doc.id,
          type: data.type || col.replace(/s$/, ""),
          slug: doc.id,
        });
      }
    }
  }

  return result;
}

async function getTrendingForChannels(
  channels: string[],
  cutoff: Date,
): Promise<{ name: string; type: string; slug: string; direction: string; delta: number }[]> {
  const snap = await db
    .collection("trending_alerts")
    .where("detectedAt", ">=", cutoff.toISOString())
    .orderBy("detectedAt", "desc")
    .get();

  const results: { name: string; type: string; slug: string; direction: string; delta: number }[] = [];

  for (const doc of snap.docs) {
    const d = doc.data();
    const entityChannels: string[] = d.channels || [];
    const matchesChannel = channels.length === 0 || entityChannels.some((c) => channels.includes(c));

    if (matchesChannel) {
      results.push({
        name: d.entityName || "Unknown",
        type: d.entityType || "entity",
        slug: d.entitySlug || "",
        direction: d.direction || "up",
        delta: d.delta || 0,
      });
    }
  }

  return results;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting subscription notification generation...`);

  try {
    const weekKey = getWeekKey();

    // Check idempotency — skip if already ran this week
    const existingCheck = await db
      .collection("webhook_queue")
      .where("event", "==", "subscription_notification")
      .where("weekKey", "==", weekKey)
      .limit(1)
      .get();

    if (!existingCheck.empty) {
      console.log(`[${AGENT_NAME}] Notifications for week ${weekKey} already queued. Skipping.`);
      await logAgentAction(AGENT_NAME, "skipped", { weekKey, reason: "already_queued" }, true);
      return;
    }

    // Read all subscriptions
    const subsSnap = await db.collection("subscriptions").get();
    console.log(`[${AGENT_NAME}] Found ${subsSnap.size} subscribers.`);

    if (subsSnap.empty) {
      console.log(`[${AGENT_NAME}] No subscribers. Done.`);
      await logAgentAction(AGENT_NAME, "no_subscribers", {}, true);
      return;
    }

    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let queued = 0;

    for (const subDoc of subsSnap.docs) {
      const userId = subDoc.id;
      const sub = subDoc.data() as SubscriptionDoc;
      const alerts = sub.alertPreferences || {
        entityAlerts: true,
        channelAlerts: true,
        weeklyDigest: true,
        trendingAlerts: false,
      };
      const channels = sub.channels || [];
      const payloads: NotificationPayload[] = [];

      // Channel alerts — new entities in subscribed channels
      if (alerts.channelAlerts && channels.length > 0) {
        const newByChannel = await getNewEntitiesForChannels(channels, cutoff);
        for (const [channel, entities] of newByChannel) {
          if (entities.length === 0) continue;
          payloads.push({
            userId,
            type: "channel_update",
            title: `${entities.length} new entit${entities.length === 1 ? "y" : "ies"} in ${channel}`,
            body: entities.map((e) => e.name).join(", "),
            entities,
            channel,
          });
        }
      }

      // Trending alerts
      if (alerts.trendingAlerts) {
        const trending = await getTrendingForChannels(channels, cutoff);
        if (trending.length > 0) {
          const top3 = trending.slice(0, 3);
          payloads.push({
            userId,
            type: "trending",
            title: `${trending.length} trending entit${trending.length === 1 ? "y" : "ies"} this week`,
            body: top3.map((t) => `${t.name} ${t.direction === "up" ? "+" : ""}${t.delta}`).join(", "),
            entities: top3,
          });
        }
      }

      // Weekly digest ready notification
      if (alerts.weeklyDigest && sub.digestFrequency !== "none") {
        payloads.push({
          userId,
          type: "digest_ready",
          title: "Your weekly digest is ready",
          body: `Covering ${channels.length} channel${channels.length !== 1 ? "s" : ""} you follow.`,
        });
      }

      // Write payloads to webhook_queue
      for (const payload of payloads) {
        await db.collection("webhook_queue").add({
          event: "subscription_notification",
          weekKey,
          payload,
          targetUserId: userId,
          createdAt: new Date().toISOString(),
          delivered: false,
        });
        queued++;
      }
    }

    console.log(`[${AGENT_NAME}] Queued ${queued} notifications for ${subsSnap.size} subscribers.`);

    await logAgentAction(AGENT_NAME, "notifications_queued", {
      weekKey,
      subscriberCount: subsSnap.size,
      notificationsQueued: queued,
    }, true);

    console.log(`[${AGENT_NAME}] Subscription notification generation complete.`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(AGENT_NAME, "failed", {}, false, message);
    console.error(`[${AGENT_NAME}] Failed:`, message);
    throw err;
  }
}
