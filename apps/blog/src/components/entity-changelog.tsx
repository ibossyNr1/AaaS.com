"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, cn } from "@aaas/ui";

interface ChangelogEntry {
  id: string;
  timestamp: string;
  detectedBy: string;
  changes: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
    changeType: "added" | "modified" | "removed";
  }[];
}

function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

function truncateValue(value: unknown, max = 50): string {
  if (value === null || value === undefined) return "null";
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (str.length <= max) return str;
  return str.slice(0, max) + "\u2026";
}

const CHANGE_STYLES = {
  added: {
    dot: "bg-green-500",
    badge: "bg-green-500/10 text-green-500 border-green-500/20",
    label: "Added",
  },
  modified: {
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    label: "Modified",
  },
  removed: {
    dot: "bg-red-500",
    badge: "bg-red-500/10 text-red-500 border-red-500/20",
    label: "Removed",
  },
} as const;

export function EntityChangelog({
  type,
  slug,
}: {
  type: string;
  slug: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const fetchChangelog = useCallback(async () => {
    if (fetched) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entity/${type}/${slug}/changelog`);
      if (!res.ok) {
        throw new Error(`Failed to fetch changelog (${res.status})`);
      }
      const data = await res.json();
      setEntries(Array.isArray(data) ? data.slice(0, 10) : []);
      setFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load changelog");
    } finally {
      setLoading(false);
    }
  }, [type, slug, fetched]);

  useEffect(() => {
    if (expanded && !fetched) {
      fetchChangelog();
    }
  }, [expanded, fetched, fetchChangelog]);

  return (
    <section className="py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-2 text-sm font-mono tracking-wide uppercase",
            "text-circuit hover:opacity-80 transition-opacity"
          )}
        >
          <svg
            className={cn(
              "w-4 h-4 transition-transform duration-200",
              expanded && "rotate-90"
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
          View Change History
        </button>

        {expanded && (
          <div className="mt-6">
            {loading && (
              <p className="text-text-muted text-sm font-mono animate-pulse">
                Loading changelog...
              </p>
            )}

            {error && (
              <p className="text-red-500 text-sm font-mono">{error}</p>
            )}

            {!loading && !error && entries.length === 0 && fetched && (
              <p className="text-text-muted text-sm">
                No changes recorded yet.
              </p>
            )}

            {entries.length > 0 && (
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                <div className="space-y-6">
                  {entries.map((entry) => (
                    <div key={entry.id} className="relative">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1.5 w-[9px] h-[9px] rounded-full bg-circuit border-2 border-surface" />

                      <Card
                        variant="glass"
                        className="bg-surface border border-border p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span
                              className="text-xs text-text-muted font-mono"
                              title={new Date(entry.timestamp).toLocaleString()}
                            >
                              {relativeTime(entry.timestamp)}
                            </span>
                            <span className="text-xs text-text-muted">
                              detected by{" "}
                              <span className="text-circuit font-mono">
                                {entry.detectedBy}
                              </span>
                            </span>
                          </div>
                          <span className="text-xs text-text-muted font-mono">
                            {entry.changes.length} field
                            {entry.changes.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {entry.changes.map((change, i) => {
                            const style = CHANGE_STYLES[change.changeType];
                            return (
                              <div
                                key={`${entry.id}-${change.field}-${i}`}
                                className="flex items-start gap-3 text-xs"
                              >
                                <span
                                  className={cn(
                                    "inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono uppercase tracking-wider shrink-0 mt-0.5",
                                    style.badge
                                  )}
                                >
                                  {style.label}
                                </span>

                                <span className="font-mono text-text font-medium shrink-0">
                                  {change.field}
                                </span>

                                <div className="flex items-center gap-1.5 text-text-muted min-w-0">
                                  {change.changeType !== "added" && (
                                    <span
                                      className="font-mono truncate max-w-[200px]"
                                      title={String(change.oldValue ?? "")}
                                    >
                                      {truncateValue(change.oldValue)}
                                    </span>
                                  )}
                                  {change.changeType === "modified" && (
                                    <span className="text-text-muted shrink-0">
                                      &rarr;
                                    </span>
                                  )}
                                  {change.changeType !== "removed" && (
                                    <span
                                      className="font-mono truncate max-w-[200px]"
                                      title={String(change.newValue ?? "")}
                                    >
                                      {truncateValue(change.newValue)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
