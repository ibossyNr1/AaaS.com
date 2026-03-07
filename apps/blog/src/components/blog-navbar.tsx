"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@aaas/ui";

const channels = [
  { label: "Research", href: "/?channel=research" },
  { label: "Marketing", href: "/?channel=marketing" },
  { label: "DevOps", href: "/?channel=devops" },
  { label: "Strategy", href: "/?channel=strategy" },
];

export function BlogNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-base/60 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight text-text">
              AaaS
            </span>
            <span className="text-text-muted font-mono text-sm">.blog</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {channels.map((ch) => (
              <Link
                key={ch.label}
                href={ch.href}
                className="text-sm text-text-muted hover:text-text transition-colors"
              >
                {ch.label}
              </Link>
            ))}
            <a
              href="https://agents-as-a-service.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue hover:underline"
            >
              Platform →
            </a>
          </nav>

          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span
              className={cn(
                "block w-5 h-0.5 bg-text transition-transform",
                mobileOpen && "rotate-45 translate-y-2"
              )}
            />
            <span
              className={cn(
                "block w-5 h-0.5 bg-text transition-opacity",
                mobileOpen && "opacity-0"
              )}
            />
            <span
              className={cn(
                "block w-5 h-0.5 bg-text transition-transform",
                mobileOpen && "-rotate-45 -translate-y-2"
              )}
            />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-base/95 backdrop-blur-xl pt-20 px-6 md:hidden">
          <nav className="flex flex-col gap-4">
            {channels.map((ch) => (
              <Link
                key={ch.label}
                href={ch.href}
                onClick={() => setMobileOpen(false)}
                className="text-xl font-medium text-text"
              >
                {ch.label}
              </Link>
            ))}
            <a
              href="https://agents-as-a-service.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-medium text-blue mt-4"
            >
              Platform →
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
