"use client";

import { cn } from "@aaas/ui";
import { useWatchlist } from "@/lib/use-watchlist";

interface WatchButtonProps {
  type: string;
  slug: string;
  name: string;
  className?: string;
}

export function WatchButton({ type, slug, name, className }: WatchButtonProps) {
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(type, slug);

  return (
    <button
      onClick={() => toggle(type, slug, name)}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full border transition-colors",
        watched
          ? "border-circuit text-circuit bg-circuit/10"
          : "border-border text-text-muted hover:text-text hover:border-text",
        className,
      )}
    >
      {watched ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.723.723 0 01-.69 0h-.002z" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-3.5 h-3.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
          />
        </svg>
      )}
      {watched ? "Watching" : "Watch"}
    </button>
  );
}
