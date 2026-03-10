"use client";

import { useState, useEffect } from "react";
import { cn } from "./cn";

interface DeployEntry {
  agent: string;
  action: string;
  status: "success" | "pending" | "running";
  time: string;
}

const sampleEntries: DeployEntry[] = [
  { agent: "ctx-engine", action: "Context vector indexed", status: "success", time: "2s ago" },
  { agent: "skill-router", action: "Routing model selected", status: "success", time: "5s ago" },
  { agent: "mem-sync", action: "Memory checkpoint saved", status: "running", time: "now" },
  { agent: "audit-agent", action: "ISO 9001 scan queued", status: "pending", time: "12s ago" },
  { agent: "deploy-ops", action: "Agent v2.4.1 deployed", status: "success", time: "18s ago" },
  { agent: "llm-bridge", action: "Model fallback initiated", status: "running", time: "now" },
  { agent: "data-pipe", action: "ETL pipeline complete", status: "success", time: "31s ago" },
  { agent: "crm-agent", action: "Lead scoring updated", status: "success", time: "45s ago" },
];

const statusColors = {
  success: "text-emerald-400",
  pending: "text-yellow-400",
  running: "text-circuit animate-feed-pulse",
};

const statusDots = {
  success: "bg-emerald-400",
  pending: "bg-yellow-400",
  running: "bg-circuit animate-pulse-dot",
};

interface DeployFeedProps {
  className?: string;
  maxItems?: number;
}

export function DeployFeed({ className, maxItems = 5 }: DeployFeedProps) {
  const [entries, setEntries] = useState<DeployEntry[]>(
    sampleEntries.slice(0, maxItems)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setEntries((prev) => {
        const next = [...prev];
        const randomIdx = Math.floor(Math.random() * sampleEntries.length);
        const newEntry = {
          ...sampleEntries[randomIdx]!,
          time: "now",
          status: "running" as const,
        };
        next.unshift(newEntry);
        return next.slice(0, maxItems);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [maxItems]);

  return (
    <div className={cn("glass rounded-lg overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="w-2 h-2 rounded-full bg-circuit animate-pulse-dot" />
        <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
          Live Deploy Feed
        </span>
      </div>
      <div className="divide-y divide-border">
        {entries.map((entry, i) => (
          <div
            key={`${entry.agent}-${i}`}
            className="flex items-center gap-3 px-4 py-2.5 text-xs font-mono transition-all duration-300"
            style={{
              opacity: 1 - i * 0.12,
            }}
          >
            <div
              className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusDots[entry.status])}
            />
            <span className="text-circuit font-semibold w-24 truncate">
              {entry.agent}
            </span>
            <span className={cn("flex-1 truncate", statusColors[entry.status])}>
              {entry.action}
            </span>
            <span className="text-text-muted text-[10px] w-14 text-right">
              {entry.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
