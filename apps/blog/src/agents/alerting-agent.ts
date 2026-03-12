/**
 * Alerting Agent — Aggregates health alerts and agent failures into summaries.
 *
 * Reads health_alerts and agent_logs for failures, groups by severity,
 * and writes structured alert summaries to alert_summaries/latest.
 */

import { db, logAgentAction } from "./logger";
import { FieldValue } from "firebase-admin/firestore";

const AGENT_NAME = "alerting";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AlertEntry {
  id: string;
  source: "health" | "agent_failure";
  severity: "critical" | "warning" | "info";
  message: string;
  details: Record<string, unknown>;
  timestamp: string;
}

interface AlertSummary {
  critical: AlertEntry[];
  warning: AlertEntry[];
  info: AlertEntry[];
  totalAlerts: number;
  generatedAt: string;
  updatedAt: FirebaseFirestore.FieldValue;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function toISOString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "object" && val !== null && "toDate" in val) {
    const d = (val as { toDate: () => Date }).toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString() : new Date().toISOString();
  }
  if (typeof val === "string") return val;
  return new Date().toISOString();
}

/* -------------------------------------------------------------------------- */
/*  Main                                                                       */
/* -------------------------------------------------------------------------- */

export async function run(): Promise<void> {
  console.log("[alerting] Aggregating alerts and failures...");

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const alerts: AlertEntry[] = [];

  // 1. Read recent health alerts
  try {
    const healthSnap = await db
      .collection("health_alerts")
      .where("timestamp", ">=", twentyFourHoursAgo)
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    for (const doc of healthSnap.docs) {
      const d = doc.data();
      const score = (d.score as number) ?? 0;

      let severity: "critical" | "warning" | "info";
      if (score < 50) severity = "critical";
      else if (score < 70) severity = "warning";
      else severity = "info";

      alerts.push({
        id: doc.id,
        source: "health",
        severity,
        message: (d.message as string) ?? `Health score: ${score}`,
        details: {
          score,
          status: d.status,
          components: d.components,
        },
        timestamp: toISOString(d.timestamp),
      });
    }
  } catch (err) {
    console.warn("[alerting] Failed to read health_alerts:", err instanceof Error ? err.message : err);
  }

  // 2. Read recent agent failures from agent_logs
  try {
    const failureSnap = await db
      .collection("agent_logs")
      .where("success", "==", false)
      .where("timestamp", ">=", twentyFourHoursAgo)
      .orderBy("timestamp", "desc")
      .limit(200)
      .get();

    // Group failures by agent to avoid flooding
    const failuresByAgent = new Map<string, { count: number; latestError: string; latestTimestamp: string; docId: string }>();

    for (const doc of failureSnap.docs) {
      const d = doc.data();
      const agent = (d.agent as string) ?? "unknown";
      const existing = failuresByAgent.get(agent);

      if (!existing) {
        failuresByAgent.set(agent, {
          count: 1,
          latestError: (d.error as string) ?? "Unknown error",
          latestTimestamp: toISOString(d.timestamp),
          docId: doc.id,
        });
      } else {
        existing.count++;
      }
    }

    for (const [agent, data] of failuresByAgent) {
      let severity: "critical" | "warning" | "info";
      if (data.count >= 5) severity = "critical";
      else if (data.count >= 2) severity = "warning";
      else severity = "info";

      alerts.push({
        id: data.docId,
        source: "agent_failure",
        severity,
        message: `Agent "${agent}" failed ${data.count} time(s) in 24h: ${data.latestError}`,
        details: {
          agent,
          failureCount: data.count,
          latestError: data.latestError,
        },
        timestamp: data.latestTimestamp,
      });
    }
  } catch (err) {
    console.warn("[alerting] Failed to read agent_logs:", err instanceof Error ? err.message : err);
  }

  // 3. Group by severity
  const critical = alerts.filter((a) => a.severity === "critical");
  const warning = alerts.filter((a) => a.severity === "warning");
  const info = alerts.filter((a) => a.severity === "info");

  const summary: AlertSummary = {
    critical,
    warning,
    info,
    totalAlerts: alerts.length,
    generatedAt: new Date().toISOString(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // 4. Write summary
  await db.collection("alert_summaries").doc("latest").set(summary);

  console.log(`[alerting] Summary: ${critical.length} critical, ${warning.length} warning, ${info.length} info (${alerts.length} total)`);

  await logAgentAction(AGENT_NAME, "alert_summary_generated", {
    totalAlerts: alerts.length,
    critical: critical.length,
    warning: warning.length,
    info: info.length,
  }, true);

  console.log("[alerting] Alert aggregation complete.");
}
