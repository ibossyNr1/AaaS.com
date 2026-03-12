"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, cn } from "@aaas/ui";

interface ScoreSnapshot {
  id: string;
  timestamp: string;
  adoption: number;
  quality: number;
  freshness: number;
  citations: number;
  engagement: number;
  composite: number;
}

const DIMENSIONS = [
  { key: "adoption", label: "Adoption", color: "var(--circuit)" },
  { key: "quality", label: "Quality", color: "var(--accent-teal, #00d4b8)" },
  { key: "freshness", label: "Freshness", color: "var(--pastel-gold, #F8D974)" },
  { key: "citations", label: "Citations", color: "var(--pastel-lavender, #939AFF)" },
  { key: "engagement", label: "Engagement", color: "var(--pastel-mint, #69D4A6)" },
] as const;

function Sparkline({
  data,
  color = "var(--circuit)",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 300;
  const h = 60;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-16"
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

function MiniBar({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-mono text-text-muted w-20 shrink-0 truncate">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-text-muted w-8 text-right">{value}</span>
    </div>
  );
}

export function ScoreHistoryChart({
  type,
  slug,
}: {
  type: string;
  slug: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<ScoreSnapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entity/${type}/${slug}/history`);
      if (!res.ok) {
        throw new Error(`Failed to fetch score history (${res.status})`);
      }
      const data = await res.json();
      // API returns desc order; reverse for chronological chart display
      const sorted = Array.isArray(data) ? [...data].reverse() : [];
      setHistory(sorted);
      setFetched(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load score history",
      );
    } finally {
      setLoading(false);
    }
  }, [type, slug, fetched]);

  useEffect(() => {
    if (expanded && !fetched) {
      fetchHistory();
    }
  }, [expanded, fetched, fetchHistory]);

  const latest = history.length > 0 ? history[history.length - 1] : null;

  return (
    <section className="py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2 text-sm font-mono tracking-wide uppercase",
            "text-circuit hover:opacity-80 transition-opacity",
          )}
        >
          <svg
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              expanded && "rotate-90",
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          Score Trends
        </button>

        {expanded && (
          <div className="mt-6">
            {loading && (
              <p className="text-text-muted text-sm font-mono animate-pulse">
                Loading score history...
              </p>
            )}

            {error && (
              <p className="text-red-500 text-sm font-mono">{error}</p>
            )}

            {!loading && !error && history.length === 0 && fetched && (
              <p className="text-text-muted text-sm">
                No score history recorded yet.
              </p>
            )}

            {history.length > 0 && (
              <Card
                variant="glass"
                className="bg-surface border border-border p-5"
              >
                {/* Composite sparkline */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                      Composite Score
                    </span>
                    {latest && (
                      <span className="text-sm font-mono text-circuit font-medium">
                        {latest.composite}
                      </span>
                    )}
                  </div>
                  <div className="border border-border rounded-md p-2 bg-surface">
                    <Sparkline
                      data={history.map((h) => h.composite)}
                      color="var(--circuit)"
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-[10px] font-mono text-text-muted">
                    <span>
                      {history.length > 0
                        ? new Date(history[0].timestamp).toLocaleDateString()
                        : ""}
                    </span>
                    <span>{history.length} snapshots</span>
                    <span>
                      {latest
                        ? new Date(latest.timestamp).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                </div>

                {/* Dimension bars */}
                {latest && (
                  <div className="space-y-2 pt-3 border-t border-border">
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider">
                      Latest Dimensions
                    </span>
                    <div className="space-y-1.5 mt-2">
                      {DIMENSIONS.map((dim) => (
                        <MiniBar
                          key={dim.key}
                          label={dim.label}
                          value={latest[dim.key as keyof ScoreSnapshot] as number}
                          color={dim.color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
