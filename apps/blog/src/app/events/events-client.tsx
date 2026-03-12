"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Card, cn } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IndexEvent {
  id: string;
  type: string;
  entityType?: string;
  slug?: string;
  data: Record<string, unknown>;
  timestamp: string;
}

type EventFilter = "all" | string;

const EVENT_TYPES = [
  { value: "all", label: "All Events" },
  { value: "entity.created", label: "Created" },
  { value: "entity.updated", label: "Updated" },
  { value: "entity.deleted", label: "Deleted" },
  { value: "score.changed", label: "Score Changed" },
  { value: "submission.approved", label: "Approved" },
  { value: "submission.rejected", label: "Rejected" },
  { value: "digest.published", label: "Digest" },
  { value: "trending.alert", label: "Trending" },
];

const VALID_ENTITY_TYPES = new Set([
  "tool",
  "model",
  "agent",
  "skill",
  "script",
  "benchmark",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function eventColor(type: string): string {
  switch (type) {
    case "entity.created":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "entity.updated":
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    case "entity.deleted":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case "score.changed":
      return "bg-purple-500/10 text-purple-400 border-purple-500/30";
    case "submission.approved":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    case "submission.rejected":
      return "bg-red-500/10 text-red-400 border-red-500/30";
    case "digest.published":
      return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    case "trending.alert":
      return "bg-circuit/10 text-circuit border-circuit/30";
    default:
      return "bg-surface text-text-muted border-border";
  }
}

function eventIcon(type: string): string {
  switch (type) {
    case "entity.created":
      return "+";
    case "entity.updated":
      return "~";
    case "entity.deleted":
      return "x";
    case "score.changed":
      return "#";
    case "submission.approved":
      return "ok";
    case "submission.rejected":
      return "no";
    case "digest.published":
      return ">>>";
    case "trending.alert":
      return "^";
    default:
      return "?";
  }
}

function summarizeData(data: Record<string, unknown>): string {
  const parts: string[] = [];
  if (data.name) parts.push(String(data.name));
  if (data.message) parts.push(String(data.message));
  if (data.oldScore !== undefined && data.newScore !== undefined) {
    parts.push(`${data.oldScore} -> ${data.newScore}`);
  }
  if (data.reason) parts.push(String(data.reason));
  if (parts.length === 0 && Object.keys(data).length > 0) {
    return Object.keys(data).slice(0, 3).join(", ");
  }
  return parts.join(" — ") || "No additional data";
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function EventBadge({ type }: { type: string }) {
  const shortLabel = type.split(".").pop() ?? type;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase border",
        eventColor(type),
      )}
    >
      <span className="opacity-70">{eventIcon(type)}</span>
      {shortLabel}
    </span>
  );
}

function StreamStatus({
  connected,
  paused,
  onToggle,
}: {
  connected: boolean;
  paused: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            connected && !paused
              ? "bg-emerald-400 animate-pulse"
              : paused
                ? "bg-amber-400"
                : "bg-red-400",
          )}
        />
        <span className="text-xs font-mono text-text-muted">
          {connected && !paused
            ? "Live"
            : paused
              ? "Paused"
              : "Disconnected"}
        </span>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "text-xs font-mono px-3 py-1 rounded-full border transition-colors",
          paused
            ? "border-circuit text-circuit hover:bg-circuit/10"
            : "border-border text-text-muted hover:text-text hover:border-text-muted",
        )}
      >
        {paused ? "Resume" : "Pause"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function EventsClient() {
  const [events, setEvents] = useState<IndexEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventFilter>("all");
  const [paused, setPaused] = useState(false);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pausedRef = useRef(paused);

  // Keep ref in sync
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // Initial fetch
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events?limit=50");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data.events ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  // SSE connection
  useEffect(() => {
    fetchEvents();

    const es = new EventSource("/api/events/stream");
    eventSourceRef.current = es;

    es.addEventListener("connected", () => {
      setConnected(true);
    });

    es.addEventListener("event", (e) => {
      if (pausedRef.current) return;
      try {
        const event = JSON.parse(e.data) as IndexEvent;
        setEvents((prev) => [event, ...prev].slice(0, 200));
      } catch {
        // ignore parse errors
      }
    });

    es.addEventListener("error", () => {
      setConnected(false);
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [fetchEvents]);

  const filtered =
    filter === "all"
      ? events
      : events.filter((ev) => ev.type === filter);

  if (loading) {
    return (
      <Card className="!p-0 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-start gap-4 px-4 py-4 border-b border-border last:border-0"
          >
            <div className="w-16 h-5 rounded bg-surface animate-pulse shrink-0" />
            <div className="flex-grow space-y-2">
              <div className="h-3.5 w-48 bg-surface rounded animate-pulse" />
              <div className="h-2.5 w-32 bg-surface rounded animate-pulse" />
            </div>
            <div className="h-3 w-14 bg-surface rounded animate-pulse shrink-0" />
          </div>
        ))}
      </Card>
    );
  }

  if (error && events.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm font-mono text-red-500 mb-2">
          Failed to load event stream
        </p>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={fetchEvents}
          className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={cn(
                "text-xs font-mono px-3 py-1.5 rounded-full border transition-colors",
                filter === t.value
                  ? "border-circuit text-circuit bg-circuit/10"
                  : "border-border text-text-muted hover:text-text hover:border-text-muted",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <StreamStatus
          connected={connected}
          paused={paused}
          onToggle={() => setPaused((p) => !p)}
        />
      </div>

      {/* Event count */}
      <p className="text-xs font-mono text-text-muted">
        {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        {filter !== "all" && (
          <span>
            {" "}
            matching <span className="text-circuit">{filter}</span>
          </span>
        )}
      </p>

      {/* Event list */}
      <Card className="!p-0 overflow-hidden">
        {filtered.length > 0 ? (
          filtered.map((ev) => {
            const hasLink =
              ev.entityType &&
              ev.slug &&
              VALID_ENTITY_TYPES.has(ev.entityType);

            return (
              <div
                key={ev.id}
                className="flex items-start gap-4 px-4 py-4 border-b border-border last:border-0 hover:bg-surface/30 transition-colors"
              >
                <EventBadge type={ev.type} />

                <div className="flex-grow min-w-0">
                  {hasLink ? (
                    <Link
                      href={`/${ev.entityType}/${ev.slug}`}
                      className="text-sm text-text hover:text-circuit transition-colors font-medium truncate block"
                    >
                      {ev.entityType}/{ev.slug}
                    </Link>
                  ) : (
                    <p className="text-sm text-text font-medium truncate">
                      {ev.type}
                    </p>
                  )}
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {summarizeData(ev.data)}
                  </p>
                </div>

                <span className="text-[10px] font-mono text-text-muted whitespace-nowrap shrink-0 pt-0.5">
                  {relativeTime(ev.timestamp)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="px-4 py-12 text-center text-text-muted text-sm">
            No events recorded yet.
          </div>
        )}
      </Card>
    </div>
  );
}
