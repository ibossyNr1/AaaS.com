"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Button, cn } from "@aaas/ui";
import Link from "next/link";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AdminStats {
  totalEntities: number;
  pendingSubmissions: number;
  agentHealth: { total: number; healthy: number; errored: number };
  errorCount: number;
  countByType: Record<string, number>;
}

interface AgentSummary {
  name: string;
  lastRunTime: string | null;
  lastStatus: boolean | null;
  runCount: number;
  errorCount: number;
  lastAction: string | null;
}

interface RecentLog {
  timestamp: string | null;
  agent: string;
  action: string;
  success: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
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

function StatusDot({ status }: { status: boolean | null }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full shrink-0",
        status === true && "bg-emerald-500",
        status === false && "bg-red-500",
        status === null && "bg-neutral-500",
      )}
    />
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-surface rounded", className)} />
  );
}

function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: string | number;
  variant?: "default" | "circuit" | "red" | "amber";
}) {
  return (
    <Card className="space-y-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
        {label}
      </span>
      <span
        className={cn(
          "block text-2xl font-mono font-bold",
          variant === "default" && "text-text",
          variant === "circuit" && "text-circuit",
          variant === "red" && "text-accent-red",
          variant === "amber" && "text-amber-500",
        )}
      >
        {value}
      </span>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function AdminClient() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [logs, setLogs] = useState<RecentLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [triggeringAgent, setTriggeringAgent] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, agentsRes] = await Promise.all([
        fetch("/api/dashboard/stats"),
        fetch("/api/admin/agents"),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats({
          totalEntities: data.entityHealth?.totalEntities ?? 0,
          pendingSubmissions: data.entityHealth?.healingQueuePending ?? 0,
          agentHealth: {
            total: data.agents?.length ?? 0,
            healthy: data.agents?.filter((a: AgentSummary) => a.lastStatus === true).length ?? 0,
            errored: data.agents?.filter((a: AgentSummary) => a.lastStatus === false).length ?? 0,
          },
          errorCount: data.agents?.reduce(
            (sum: number, a: AgentSummary) => sum + (a.lastStatus === false ? 1 : 0),
            0,
          ) ?? 0,
          countByType: data.entityHealth?.countByType ?? {},
        });
        setLogs(data.recentLogs ?? []);
      }

      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAgents(agentsData.agents ?? []);
      }

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const triggerAgent = async (agentName: string) => {
    setTriggeringAgent(agentName);
    try {
      await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agentName }),
      });
      // Refresh after trigger
      setTimeout(fetchData, 2000);
    } catch {
      // silent fail
    } finally {
      setTriggeringAgent(null);
    }
  };

  /* Loading */
  if (!stats && !error) {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24" />
          ))}
        </div>
        <SkeletonBlock className="h-64" />
        <SkeletonBlock className="h-48" />
      </div>
    );
  }

  /* Error */
  if (error && !stats) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm font-mono text-accent-red mb-2">
          Failed to load admin dashboard
        </p>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-10">
      {/* ---- Quick Navigation ---- */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/entities">
          <Button variant="secondary">Manage Entities</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost">System Dashboard</Button>
        </Link>
      </div>

      {/* ---- Stats Overview ---- */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Entities" value={stats.totalEntities} variant="circuit" />
          <StatCard
            label="Pending Submissions"
            value={stats.pendingSubmissions}
            variant={stats.pendingSubmissions > 0 ? "amber" : "default"}
          />
          <StatCard
            label="Agents Healthy"
            value={`${stats.agentHealth.healthy}/${stats.agentHealth.total}`}
            variant={stats.agentHealth.errored > 0 ? "red" : "circuit"}
          />
          <StatCard
            label="Error Count"
            value={stats.errorCount}
            variant={stats.errorCount > 0 ? "red" : "default"}
          />
        </div>
      </div>

      {/* ---- Entity Breakdown ---- */}
      {Object.keys(stats.countByType).length > 0 && (
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
            Entities by Type
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(stats.countByType).map(([type, count]) => (
              <Card key={type} className="text-center space-y-1">
                <span className="text-lg font-mono font-bold text-text">{count}</span>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-text-muted">
                  {type}
                </span>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ---- Quick Actions ---- */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Quick Actions
        </h2>
        <Card>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={() => triggerAgent("runner")}
              disabled={triggeringAgent === "runner"}
            >
              {triggeringAgent === "runner" ? "Triggering..." : "Run All Agents"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => triggerAgent("audit")}
              disabled={triggeringAgent === "audit"}
            >
              {triggeringAgent === "audit" ? "Triggering..." : "Trigger Audit"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => triggerAgent("enrich")}
              disabled={triggeringAgent === "enrich"}
            >
              {triggeringAgent === "enrich" ? "Triggering..." : "Trigger Enrichment"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => triggerAgent("freshness")}
              disabled={triggeringAgent === "freshness"}
            >
              {triggeringAgent === "freshness" ? "Triggering..." : "Check Freshness"}
            </Button>
          </div>
        </Card>
      </div>

      {/* ---- Agent Status ---- */}
      {agents.length > 0 && (
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
            Agent Health
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-text font-semibold">
                    {agent.name}
                  </span>
                  <StatusDot status={agent.lastStatus} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted font-mono">
                    {relativeTime(agent.lastRunTime)}
                  </span>
                  <span className="text-text-muted font-mono">
                    {agent.runCount} runs
                  </span>
                </div>
                {agent.lastAction && (
                  <p className="text-[10px] font-mono text-text-muted truncate">
                    {agent.lastAction}
                  </p>
                )}
                <Button
                  variant="ghost"
                  onClick={() => triggerAgent(agent.name)}
                  disabled={triggeringAgent === agent.name}
                  className="!text-[10px] !py-1 !px-2"
                >
                  {triggeringAgent === agent.name ? "Triggering..." : "Trigger Run"}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ---- Recent Agent Logs ---- */}
      <div>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
          Recent Agent Logs
        </h2>
        <Card className="overflow-hidden !p-0">
          {/* Table header */}
          <div className="px-4 py-2 flex items-center gap-4 border-b border-border bg-surface/30">
            <span className="w-32 text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Timestamp
            </span>
            <span className="w-28 text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Agent
            </span>
            <span className="flex-grow text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Action
            </span>
            <span className="w-16 text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">
              Status
            </span>
          </div>

          {logs.length > 0 ? (
            logs.slice(0, 20).map((log, i) => (
              <div
                key={`${log.agent}-${log.timestamp}-${i}`}
                className="px-4 py-2.5 flex items-center gap-4 border-b border-border last:border-b-0 hover:bg-surface/30 transition-colors"
              >
                <span className="w-32 text-xs font-mono text-text-muted shrink-0">
                  {formatTimestamp(log.timestamp)}
                </span>
                <span className="w-28 text-xs font-mono text-text font-semibold uppercase shrink-0">
                  {log.agent}
                </span>
                <span className="flex-grow text-xs font-mono text-text-muted truncate">
                  {log.action}
                </span>
                <span className="w-16 shrink-0 text-right">
                  <span
                    className={cn(
                      "inline-block text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
                      log.success
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-red-400 bg-red-500/10",
                    )}
                  >
                    {log.success ? "OK" : "FAIL"}
                  </span>
                </span>
              </div>
            ))
          ) : (
            <div className="px-4 py-12 text-center text-text-muted text-sm">
              No agent logs recorded yet.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
