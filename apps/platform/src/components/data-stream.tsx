"use client";

import { useState, useEffect } from "react";

const messages = [
  "CTX_ENGINE: ACTIVE",
  "AGENTS_ONLINE: 12",
  "SKILL_CALLS: 142K+",
  "VECTORS: 847K LOADED",
  "MODEL: MULTI_LLM",
  "UPTIME: 99.9999992%",
];

export function DataStream() {
  const [line, setLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLine((prev) => (prev + 1) % messages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed bottom-6 right-8 font-mono text-[0.55rem] text-right opacity-40 z-50 hidden md:block"
      aria-hidden="true"
    >
      <div className="text-circuit pointer-events-none">{messages[line]}</div>
      <a
        href="https://www.supra-forge.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-text-muted/60 mt-0.5 block hover:text-circuit transition-colors"
      >
        Powered by Supra-forge
      </a>
    </div>
  );
}
