"use client";

import { cn } from "./cn";

interface DataTapeProps {
  items: string[];
  className?: string;
  speed?: "slow" | "normal" | "fast";
}

const speedMap = {
  slow: "30s",
  normal: "20s",
  fast: "12s",
};

export function DataTape({
  items,
  className,
  speed = "normal",
}: DataTapeProps) {
  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        "overflow-hidden whitespace-nowrap font-mono text-xs text-text-muted border-y border-border py-3",
        className
      )}
    >
      <div
        className="inline-flex gap-8 animate-tape-scroll"
        style={{ animationDuration: speedMap[speed] }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-circuit/40" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
