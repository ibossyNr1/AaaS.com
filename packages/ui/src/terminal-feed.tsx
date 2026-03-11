"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "./cn";

const logLines = [
  { prefix: "sys", text: "Context engine initialized — 847 vectors loaded" },
  { prefix: "ctx", text: "User profile deep-research complete (3.2s)" },
  { prefix: "llm", text: "Model selection: claude-opus-4-6 → reasoning task" },
  { prefix: "agt", text: "Spawning crm-agent with 12 skills attached" },
  { prefix: "mem", text: "Memory checkpoint: 2.4GB context window saved" },
  { prefix: "api", text: "Open Router fallback: switched to gpt-4o-mini" },
  { prefix: "skl", text: "Skill repository: +3 new community skills merged" },
  { prefix: "aud", text: "ISO 9001 audit scan: 98.7% compliance score" },
  { prefix: "dep", text: "Agent v2.4.1 deployed to production cluster" },
  { prefix: "mkt", text: "Lead magnet pipeline: 142 new signups processed" },
];

const prefixColors: Record<string, string> = {
  sys: "text-text-muted",
  ctx: "text-circuit",
  llm: "text-pastel-sky",
  agt: "text-accent-red/70",
  mem: "text-accent-teal",
  api: "text-text-muted",
  skl: "text-circuit/60",
  aud: "text-pastel-lavender",
  dep: "text-circuit/80",
  mkt: "text-accent-red/50",
};

interface TerminalFeedProps {
  className?: string;
  maxLines?: number;
}

export function TerminalFeed({ className, maxLines = 8 }: TerminalFeedProps) {
  const [lines, setLines] = useState(logLines.slice(0, maxLines));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLines((prev) => {
        const nextLine = logLines[Math.floor(Math.random() * logLines.length)]!;
        const updated = [...prev, nextLine];
        return updated.slice(-maxLines);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [maxLines]);

  return (
    <div className={cn("glass rounded-lg overflow-hidden font-mono text-xs", className)}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-base/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-accent-red/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-circuit/30" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent-teal/50" />
        </div>
        <span className="text-text-muted text-[10px] uppercase tracking-widest ml-2">
          aaas://system-log
        </span>
      </div>
      <div ref={containerRef} className="p-4 space-y-1.5 max-h-64 overflow-hidden">
        {lines.map((line, i) => (
          <div
            key={`${line.prefix}-${i}`}
            className="flex gap-2 animate-fade-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <span className={cn("w-8 text-right", prefixColors[line.prefix])}>
              [{line.prefix}]
            </span>
            <span className="text-text/80">{line.text}</span>
          </div>
        ))}
        <div className="flex gap-2">
          <span className="w-8 text-right text-circuit">{">"}</span>
          <span className="text-circuit animate-feed-pulse">_</span>
        </div>
      </div>
    </div>
  );
}
