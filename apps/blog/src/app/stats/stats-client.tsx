"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, cn } from "@aaas/ui";
import { ENTITY_TYPES } from "@/lib/types";
import type { EntityType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface TopScorer {
  name: string;
  type: string;
  slug: string;
  composite: number;
}

interface StatsData {
  entities: {
    total: number;
    byType: Record<string, number>;
    avgComposite: number;
    topScorers: TopScorer[];
  };
  agents: {
    totalRuns: number;
    successRate: number;
    recentFailures: number;
    mostActiveAgent: string;
  };
  submissions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  media: {
    totalEpisodes: number;
  };
  subscribers: {
    total: number;
  };
  apiKeys: {
    total: number;
    active: number;
  };
  trending: {
    recentAlerts: number;
  };
  timestamp: string;
}

/* -------------------------------------------------------------------------- */
/*  Color mapping                                                              */
/* -------------------------------------------------------------------------- */

const TYPE_BAR_COLORS: Record<string, string> = {
  tools: "bg-blue-500",
  models: "bg-purple-500",
  agents: "bg-emerald-500",
  skills: "bg-amber-500",
  scripts: "bg-pink-500",
  benchmarks: "bg-cyan-500",
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  tool: "text-blue-400 bg-blue-500/10",
  model: "text-purple-400 bg-purple-500/10",
  agent: "text-emerald-400 bg-emerald-500/10",
  skill: "text-amber-400 bg-amber-500/10",
  script: "text-pink-400 bg-pink-500/10",
  benchmark: "text-cyan-400 bg-cyan-500/10",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatTimestamp(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-surface rounded", className)} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-36" />
        ))}
      </div>
      <SkeletonBlock className="h-64" />
      <SkeletonBlock className="h-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonBlock className="h-56" />
        <SkeletonBlock className="h-56" />
      </div>
    </div>
  );
}

/** Circular progress ring SVG */
function CircularProgress({ value, size = 80, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-surface"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={cn(
          value >= 90 ? "text-emerald-500" : value >= 70 ? "text-circuit" : value >= 50 ? "text-amber-500" : "text-red-500",
        )}
      />
    </svg>
  );
}

/** Metric card with large number and label */
function MetricCard({ label, value, suffix, children }: { label: string; value: string | number; suffix?: string; children?: React.ReactNode }) {
  return (
    <Card className="space-y-3">
      <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <div className="flex items-end gap-1">
        <span className="text-3xl font-bold text-text">{value}</span>
        {suffix && <span className="text-xs font-mono text-text-muted mb-1">{suffix}</span>}
      </div>
      {children}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function StatsClient() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatsData = await res.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (!stats && !error) return <LoadingSkeleton />;

  if (error && !stats) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm font-mono text-red-500 mb-2">Failed to load analytics</p>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={fetchStats}
          className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!stats) return null;

  const maxByType = Math.max(...Object.values(stats.entities.byType), 1);

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/*  Row 1: Key Metrics                                                */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Entities */}
        <MetricCard label="Total Entities" value={stats.entities.total}>
          <div className="flex gap-1 items-end h-6">
            {Object.entries(stats.entities.byType).map(([col, count]) => {
              const pct = stats.entities.total > 0 ? (count / stats.entities.total) * 100 : 0;
              return (
                <div
                  key={col}
                  className={cn("rounded-sm min-w-[4px]", TYPE_BAR_COLORS[col] || "bg-circuit")}
                  style={{ width: `${Math.max(pct, 4)}%`, height: `${Math.max((count / maxByType) * 100, 15)}%` }}
                  title={`${col}: ${count}`}
                />
              );
            })}
          </div>
        </MetricCard>

        {/* Agent Success Rate */}
        <Card className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
            Agent Success Rate
          </p>
          <div className="flex items-center gap-4">
            <CircularProgress value={stats.agents.successRate} />
            <div>
              <span className="text-2xl font-bold text-text">{stats.agents.successRate}%</span>
              <p className="text-xs font-mono text-text-muted">{stats.agents.totalRuns} runs</p>
            </div>
          </div>
        </Card>

        {/* Submissions */}
        <MetricCard label="Submissions" value={stats.submissions.total}>
          <div className="flex gap-3 text-xs font-mono">
            <span className="text-amber-500">{stats.submissions.pending} pending</span>
            <span className="text-emerald-500">{stats.submissions.approved} ok</span>
            <span className="text-red-500">{stats.submissions.rejected} rej</span>
          </div>
        </MetricCard>

        {/* API Keys */}
        <MetricCard label="API Keys" value={stats.apiKeys.active} suffix={`/ ${stats.apiKeys.total} total`}>
          <p className="text-xs font-mono text-text-muted">active keys</p>
        </MetricCard>
      </div>

      {/* ================================================================== */}
      {/*  Row 2: Entity Distribution                                        */}
      {/* ================================================================== */}
      <Card>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
          Entity Distribution
        </h2>
        <div className="space-y-3">
          {Object.entries(stats.entities.byType).map(([col, count]) => {
            const pct = stats.entities.total > 0 ? Math.round((count / stats.entities.total) * 100) : 0;
            // Map collection name to entity type for label
            const typeKey = col.endsWith("es") && col !== "benchmarks"
              ? col.slice(0, -1)
              : col.endsWith("s")
                ? col.slice(0, -1)
                : col;
            const typeInfo = ENTITY_TYPES[typeKey as EntityType];
            const label = typeInfo?.plural || col;

            return (
              <div key={col} className="flex items-center gap-3">
                <span className="w-24 text-xs font-mono text-text-muted shrink-0 text-right">
                  {label}
                </span>
                <div className="flex-grow h-6 bg-surface rounded overflow-hidden relative">
                  <div
                    className={cn("h-full rounded transition-all duration-700", TYPE_BAR_COLORS[col] || "bg-circuit")}
                    style={{ width: `${Math.max(pct, 2)}%` }}
                  />
                </div>
                <span className="w-8 text-xs font-mono text-text font-bold text-right shrink-0">
                  {count}
                </span>
                <span className="w-10 text-xs font-mono text-text-muted text-right shrink-0">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs font-mono text-text-muted">
            Avg Composite Score
          </span>
          <span className="text-sm font-mono font-bold text-circuit">
            {stats.entities.avgComposite}
          </span>
        </div>
      </Card>

      {/* ================================================================== */}
      {/*  Row 3: Top Performers                                             */}
      {/* ================================================================== */}
      <Card>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
          Top Performers
        </h2>
        {stats.entities.topScorers.length > 0 ? (
          <div className="overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 pb-2 border-b border-border">
              <span className="w-8 text-[10px] font-mono uppercase tracking-wider text-text-muted">#</span>
              <span className="flex-grow text-[10px] font-mono uppercase tracking-wider text-text-muted">Name</span>
              <span className="w-24 text-[10px] font-mono uppercase tracking-wider text-text-muted">Type</span>
              <span className="w-32 text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">Composite</span>
            </div>
            {/* Rows */}
            {stats.entities.topScorers.map((scorer, i) => {
              const maxComposite = stats.entities.topScorers[0]?.composite || 1;
              const barPct = maxComposite > 0 ? (scorer.composite / maxComposite) * 100 : 0;
              const typeInfo = ENTITY_TYPES[scorer.type as EntityType];

              return (
                <div
                  key={`${scorer.type}-${scorer.slug}`}
                  className="flex items-center gap-4 py-2.5 border-b border-border last:border-b-0 hover:bg-surface/30 transition-colors"
                >
                  <span className="w-8 text-sm font-mono text-text-muted font-bold">
                    {i + 1}
                  </span>
                  <Link
                    href={`/${scorer.type}/${scorer.slug}`}
                    className="flex-grow text-sm font-mono text-text hover:text-circuit transition-colors truncate"
                  >
                    {scorer.name}
                  </Link>
                  <span className="w-24 shrink-0">
                    <span
                      className={cn(
                        "inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
                        TYPE_BADGE_COLORS[scorer.type] || "text-text-muted bg-surface",
                      )}
                    >
                      {typeInfo?.label || scorer.type}
                    </span>
                  </span>
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <div className="flex-grow h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-circuit rounded-full transition-all duration-700"
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-text font-bold w-8 text-right">
                      {scorer.composite}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-8">
            No entities scored yet.
          </p>
        )}
      </Card>

      {/* ================================================================== */}
      {/*  Row 4: System Health (2-column)                                   */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Performance */}
        <Card>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
            Agent Performance
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Success Rate
              </span>
              <span className={cn(
                "text-sm font-mono font-bold",
                stats.agents.successRate >= 90 ? "text-emerald-500" : stats.agents.successRate >= 70 ? "text-circuit" : "text-red-500",
              )}>
                {stats.agents.successRate}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Total Runs
              </span>
              <span className="text-sm font-mono font-bold text-text">
                {stats.agents.totalRuns}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Recent Failures (24h)
              </span>
              <span className={cn(
                "text-sm font-mono font-bold",
                stats.agents.recentFailures > 0 ? "text-red-500" : "text-text",
              )}>
                {stats.agents.recentFailures}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Most Active Agent
              </span>
              <span className="text-sm font-mono font-bold text-circuit uppercase">
                {stats.agents.mostActiveAgent}
              </span>
            </div>
          </div>
        </Card>

        {/* Content Pipeline */}
        <Card>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
            Content Pipeline
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Episodes
              </span>
              <span className="text-sm font-mono font-bold text-text">
                {stats.media.totalEpisodes}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Subscribers
              </span>
              <span className="text-sm font-mono font-bold text-text">
                {stats.subscribers.total}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
                Trending Alerts (7d)
              </span>
              <span className={cn(
                "text-sm font-mono font-bold",
                stats.trending.recentAlerts > 0 ? "text-circuit" : "text-text",
              )}>
                {stats.trending.recentAlerts}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ---- Last updated ---- */}
      <p className="text-[10px] font-mono text-text-muted text-right">
        Last refreshed: {formatTimestamp(stats.timestamp)} (auto-refresh 60s)
      </p>
    </div>
  );
}
