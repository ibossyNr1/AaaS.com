/**
 * Email Template Generator
 *
 * Generates branded HTML and plain text email templates for the
 * AaaS Knowledge Index weekly digest.
 */

interface TrendingEntity {
  name: string;
  type: string;
  compositeScore: number;
  slug: string;
}

interface AgentHealthEntry {
  agent: string;
  healthy: boolean;
  lastRun?: string;
}

export interface WeeklyDigestData {
  weekLabel: string; // e.g. "Mar 3 – Mar 10, 2026"
  trending: TrendingEntity[];
  newEntities: TrendingEntity[];
  agentHealth: AgentHealthEntry[];
  unsubscribeToken: string;
  baseUrl: string; // e.g. "https://aaas.blog"
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  tool: "#3b82f6",
  model: "#a855f7",
  agent: "#22c55e",
  skill: "#eab308",
  script: "#ec4899",
  benchmark: "#00f3ff",
};

function typeBadgeColor(type: string): string {
  return TYPE_BADGE_COLORS[type] || "#00f3ff";
}

/**
 * Generate a branded HTML email for the weekly digest.
 * Uses inline CSS only for maximum email client compatibility.
 */
export function generateWeeklyDigestHtml(data: WeeklyDigestData): string {
  const { weekLabel, trending, newEntities, agentHealth, unsubscribeToken, baseUrl } = data;

  const trendingRows = trending
    .map(
      (e, i) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1a1a1c; color: #888888; font-family: 'JetBrains Mono', monospace; font-size: 13px;">${i + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1a1a1c;">
          <a href="${baseUrl}/${e.type}/${e.slug}" style="color: #ffffff; text-decoration: none; font-weight: 600;">${e.name}</a>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1a1a1c;">
          <span style="display: inline-block; background: ${typeBadgeColor(e.type)}22; color: ${typeBadgeColor(e.type)}; border: 1px solid ${typeBadgeColor(e.type)}44; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;">${e.type}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #1a1a1c; color: #00f3ff; font-family: 'JetBrains Mono', monospace; font-size: 14px; text-align: right;">${e.compositeScore}</td>
      </tr>`,
    )
    .join("");

  const newEntityRows =
    newEntities.length > 0
      ? newEntities
          .map(
            (e) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1a1a1c;">
          <a href="${baseUrl}/${e.type}/${e.slug}" style="color: #ffffff; text-decoration: none;">${e.name}</a>
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1a1a1c;">
          <span style="display: inline-block; background: ${typeBadgeColor(e.type)}22; color: ${typeBadgeColor(e.type)}; border: 1px solid ${typeBadgeColor(e.type)}44; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;">${e.type}</span>
        </td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #1a1a1c; color: #00f3ff; font-family: 'JetBrains Mono', monospace; font-size: 13px; text-align: right;">${e.compositeScore}</td>
      </tr>`,
          )
          .join("")
      : `<tr><td style="padding: 12px; color: #888888; font-style: italic;" colspan="3">No new entities this week.</td></tr>`;

  const healthRows = agentHealth
    .map(
      (a) => `
      <tr>
        <td style="padding: 6px 12px; border-bottom: 1px solid #1a1a1c;">
          <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${a.healthy ? "#22c55e" : "#ef4444"}; margin-right: 8px;"></span>
          <span style="color: #ffffff; font-size: 13px;">${a.agent}</span>
        </td>
        <td style="padding: 6px 12px; border-bottom: 1px solid #1a1a1c; color: ${a.healthy ? "#22c55e" : "#ef4444"}; font-family: 'JetBrains Mono', monospace; font-size: 12px; text-align: right;">${a.healthy ? "healthy" : "failing"}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #080809; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #080809;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 24px; text-align: center; border-bottom: 1px solid #1a1a1c;">
              <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #ffffff;">AaaS Knowledge Index</h1>
              <p style="margin: 0; font-size: 14px; color: #00f3ff; font-family: 'JetBrains Mono', monospace;">Weekly Digest</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #888888;">${weekLabel}</p>
            </td>
          </tr>

          <!-- Trending Entities -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #00f3ff; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace;">Trending</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #0d0d0f; border-radius: 8px; overflow: hidden;">
                ${trendingRows}
              </table>
            </td>
          </tr>

          <!-- New Entities -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #00f3ff; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace;">New This Week</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #0d0d0f; border-radius: 8px; overflow: hidden;">
                ${newEntityRows}
              </table>
            </td>
          </tr>

          <!-- Agent Health -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #00f3ff; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'JetBrains Mono', monospace;">Agent Health</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #0d0d0f; border-radius: 8px; overflow: hidden;">
                ${healthRows}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 32px 24px; text-align: center;">
              <a href="${baseUrl}/explore" style="display: inline-block; background: #00f3ff; color: #080809; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 6px; text-decoration: none;">Explore the Index</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; border-top: 1px solid #1a1a1c; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #888888;">You received this because you subscribed to the AaaS Knowledge Index digest.</p>
              <a href="${baseUrl}/api/unsubscribe?token=${unsubscribeToken}" style="font-size: 12px; color: #888888; text-decoration: underline;">Unsubscribe</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate a plain text version of the weekly digest.
 */
export function generatePlainTextDigest(data: WeeklyDigestData): string {
  const { weekLabel, trending, newEntities, agentHealth, unsubscribeToken, baseUrl } = data;

  const lines: string[] = [
    "AaaS Knowledge Index — Weekly Digest",
    weekLabel,
    "",
    "=".repeat(50),
    "TRENDING",
    "=".repeat(50),
  ];

  trending.forEach((e, i) => {
    lines.push(`  ${i + 1}. ${e.name} [${e.type}] — score: ${e.compositeScore}`);
    lines.push(`     ${baseUrl}/${e.type}/${e.slug}`);
  });

  lines.push("", "=".repeat(50), "NEW THIS WEEK", "=".repeat(50));

  if (newEntities.length > 0) {
    newEntities.forEach((e) => {
      lines.push(`  - ${e.name} [${e.type}] — score: ${e.compositeScore}`);
      lines.push(`    ${baseUrl}/${e.type}/${e.slug}`);
    });
  } else {
    lines.push("  No new entities this week.");
  }

  lines.push("", "=".repeat(50), "AGENT HEALTH", "=".repeat(50));

  agentHealth.forEach((a) => {
    const indicator = a.healthy ? "[OK]" : "[FAIL]";
    lines.push(`  ${indicator} ${a.agent}`);
  });

  lines.push(
    "",
    "---",
    `Explore: ${baseUrl}/explore`,
    "",
    `Unsubscribe: ${baseUrl}/api/unsubscribe?token=${unsubscribeToken}`,
  );

  return lines.join("\n");
}
