/**
 * Digest Email Agent
 *
 * Generates and sends the weekly AaaS Knowledge Index digest email.
 *
 * Workflow:
 *   1. Query trending entities (top 5 by composite score)
 *   2. Query new entities added in the last 7 days
 *   3. Query agent_logs for health summary
 *   4. Generate HTML + plain text emails
 *   5. Read active subscribers from Firestore
 *   6. Send email via SendGrid/Resend or stub to console + email_logs
 *
 * Schedule: weekly (Sunday)
 * Idempotent: yes — generates fresh digest on every run
 */

import { db, logAgentAction } from "./logger";
import { generateWeeklyDigestHtml, generatePlainTextDigest, type WeeklyDigestData } from "../lib/email-templates";

const AGENT_NAME = "digest-email-agent";

const ENTITY_COLLECTIONS = ["tools", "models", "agents", "skills", "scripts", "benchmarks"];

const KNOWN_AGENTS = [
  "schema-auditor",
  "schema-healer",
  "link-validator",
  "freshness-agent",
  "ranking-agent",
  "media-agent",
  "ingestion-agent",
  "changelog-agent",
];

const BASE_URL = process.env.AAAS_BASE_URL || "https://aaas.blog";

interface TrendingEntity {
  name: string;
  type: string;
  compositeScore: number;
  slug: string;
}

interface Subscriber {
  email: string;
  unsubscribeToken: string;
}

function formatWeekLabel(): string {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(weekAgo)} – ${fmt(now)}`;
}

async function getTrendingEntities(limit: number): Promise<TrendingEntity[]> {
  const results: TrendingEntity[] = [];
  const perCollection = Math.ceil(limit / ENTITY_COLLECTIONS.length);

  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db
      .collection(col)
      .orderBy("scores.composite", "desc")
      .limit(perCollection)
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      results.push({
        name: data.name || doc.id,
        type: data.type || col.replace(/s$/, ""),
        compositeScore: data.scores?.composite || 0,
        slug: doc.id,
      });
    }
  }

  return results
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .slice(0, limit);
}

async function getNewEntities(): Promise<TrendingEntity[]> {
  const results: TrendingEntity[] = [];
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const col of ENTITY_COLLECTIONS) {
    const snap = await db
      .collection(col)
      .where("addedDate", ">=", cutoff)
      .orderBy("addedDate", "desc")
      .get();

    for (const doc of snap.docs) {
      const data = doc.data();
      results.push({
        name: data.name || doc.id,
        type: data.type || col.replace(/s$/, ""),
        compositeScore: data.scores?.composite || 0,
        slug: doc.id,
      });
    }
  }

  return results;
}

async function getAgentHealth(): Promise<{ agent: string; healthy: boolean; lastRun?: string }[]> {
  const health: { agent: string; healthy: boolean; lastRun?: string }[] = [];

  for (const agentName of KNOWN_AGENTS) {
    const snap = await db
      .collection("agent_logs")
      .where("agent", "==", agentName)
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snap.empty) {
      health.push({ agent: agentName, healthy: false });
    } else {
      const log = snap.docs[0].data();
      health.push({
        agent: agentName,
        healthy: log.success === true,
        lastRun: log.timestamp?.toDate?.()?.toISOString?.() || undefined,
      });
    }
  }

  return health;
}

async function getActiveSubscribers(): Promise<Subscriber[]> {
  const snap = await db
    .collection("subscribers")
    .where("active", "==", true)
    .get();

  return snap.docs.map((doc) => ({
    email: doc.data().email,
    unsubscribeToken: doc.data().unsubscribeToken,
  }));
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  _text: string,
): Promise<boolean> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (sendgridKey) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: "digest@aaas.blog", name: "AaaS Knowledge Index" },
          subject,
          content: [
            { type: "text/plain", value: _text },
            { type: "text/html", value: html },
          ],
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AaaS Knowledge Index <digest@aaas.blog>",
          to,
          subject,
          html,
          text: _text,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Stub: no email provider configured
  console.log(`  [stub] Would send email to: ${to}`);
  return true;
}

export async function run(): Promise<void> {
  console.log(`[${AGENT_NAME}] Starting weekly digest generation...`);

  let subscriberCount = 0;
  let sentCount = 0;
  let failedCount = 0;

  try {
    // Phase 1: Gather data
    console.log(`[${AGENT_NAME}] Gathering digest data...`);

    const [trending, newEntities, agentHealth, subscribers] = await Promise.all([
      getTrendingEntities(5),
      getNewEntities(),
      getAgentHealth(),
      getActiveSubscribers(),
    ]);

    subscriberCount = subscribers.length;

    console.log(`[${AGENT_NAME}] Data gathered:`);
    console.log(`  Trending: ${trending.length} entities`);
    console.log(`  New this week: ${newEntities.length} entities`);
    console.log(`  Agent health: ${agentHealth.length} agents checked`);
    console.log(`  Active subscribers: ${subscriberCount}`);

    if (subscriberCount === 0) {
      console.log(`[${AGENT_NAME}] No active subscribers. Skipping email send.`);
      await logAgentAction(AGENT_NAME, "digest_skipped", { reason: "no_subscribers" }, true);
      return;
    }

    // Phase 2: Generate and send emails
    const weekLabel = formatWeekLabel();
    const subject = `AaaS Weekly Digest — ${weekLabel}`;

    const hasSendProvider = !!(process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY);
    if (!hasSendProvider) {
      console.log(`[${AGENT_NAME}] No email provider configured (SENDGRID_API_KEY / RESEND_API_KEY). Using stub.`);
    }

    for (const subscriber of subscribers) {
      const digestData: WeeklyDigestData = {
        weekLabel,
        trending,
        newEntities,
        agentHealth,
        unsubscribeToken: subscriber.unsubscribeToken,
        baseUrl: BASE_URL,
      };

      const html = generateWeeklyDigestHtml(digestData);
      const text = generatePlainTextDigest(digestData);

      const sent = await sendEmail(subscriber.email, subject, html, text);

      // Log to email_logs collection
      await db.collection("email_logs").add({
        to: subscriber.email,
        subject,
        type: "weekly-digest",
        sent,
        provider: hasSendProvider ? (process.env.SENDGRID_API_KEY ? "sendgrid" : "resend") : "stub",
        timestamp: new Date().toISOString(),
      });

      if (sent) {
        sentCount++;
      } else {
        failedCount++;
        console.error(`  Failed to send to: ${subscriber.email}`);
      }
    }

    await logAgentAction(
      AGENT_NAME,
      "digest_complete",
      {
        subscriberCount,
        sentCount,
        failedCount,
        trendingCount: trending.length,
        newEntityCount: newEntities.length,
        weekLabel,
      },
      failedCount === 0,
    );

    console.log(
      `[${AGENT_NAME}] Digest complete. ${sentCount}/${subscriberCount} emails sent. ${failedCount} failed.`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logAgentAction(
      AGENT_NAME,
      "digest_failed",
      { subscriberCount, sentCount, failedCount },
      false,
      message,
    );
    console.error(`[${AGENT_NAME}] Digest failed:`, message);
    throw err;
  }
}
