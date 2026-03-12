"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Container, Section, Card, cn } from "@aaas/ui";
import { useWatchlist, type WatchlistItem } from "@/lib/use-watchlist";
import { ENTITY_TYPES, type EntityType, type EntityScores } from "@/lib/types";

type SortMode = "newest" | "alpha" | "type";

interface FetchedData {
  scores?: EntityScores;
  loading: boolean;
}

export function WatchlistClient() {
  const { items, remove, clear, count } = useWatchlist();
  const [sort, setSort] = useState<SortMode>("newest");
  const [confirmClear, setConfirmClear] = useState(false);
  const [fetched, setFetched] = useState<Record<string, FetchedData>>({});

  // Lazy-fetch scores for each item
  useEffect(() => {
    items.forEach((item) => {
      const key = `${item.type}/${item.slug}`;
      if (fetched[key]) return;
      setFetched((prev) => ({ ...prev, [key]: { loading: true } }));
      fetch(`/api/entity/${item.type}/${item.slug}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          setFetched((prev) => ({
            ...prev,
            [key]: { scores: data?.scores, loading: false },
          }));
        })
        .catch(() => {
          setFetched((prev) => ({ ...prev, [key]: { loading: false } }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  const sorted = [...items].sort((a, b) => {
    if (sort === "newest") return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    if (sort === "alpha") return a.name.localeCompare(b.name);
    return a.type.localeCompare(b.type);
  });

  const handleClear = () => {
    if (confirmClear) {
      clear();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  return (
    <Section className="pt-28 pb-16">
      <Container className="max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text mb-1">Watchlist</h1>
            <p className="text-sm text-text-muted font-mono">
              {count} {count === 1 ? "entity" : "entities"} tracked
            </p>
          </div>
          {count > 0 && (
            <div className="flex items-center gap-3">
              {/* Sort */}
              <div className="flex items-center gap-1.5 text-xs font-mono text-text-muted">
                <span>Sort:</span>
                {(["newest", "alpha", "type"] as SortMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSort(mode)}
                    className={cn(
                      "px-2 py-1 rounded transition-colors",
                      sort === mode
                        ? "bg-circuit/10 text-circuit"
                        : "hover:text-text",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              {/* Clear */}
              <button
                onClick={handleClear}
                className={cn(
                  "text-xs font-mono px-3 py-1.5 rounded border transition-colors",
                  confirmClear
                    ? "border-accent-red text-accent-red bg-accent-red/10"
                    : "border-border text-text-muted hover:text-text hover:border-text",
                )}
              >
                {confirmClear ? "Confirm clear?" : "Clear all"}
              </button>
            </div>
          )}
        </div>

        {/* Empty state */}
        {count === 0 && (
          <Card className="text-center py-16">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-12 h-12 mx-auto text-text-muted/40 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
              />
            </svg>
            <p className="text-text-muted mb-2">Your watchlist is empty.</p>
            <p className="text-sm text-text-muted">
              Visit entity pages and click <span className="text-circuit font-mono">Watch</span> to track them.
            </p>
            <Link
              href="/explore"
              className="inline-block mt-6 text-sm text-circuit hover:underline font-mono"
            >
              Explore entities →
            </Link>
          </Card>
        )}

        {/* Grid */}
        {count > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((item) => (
              <WatchlistCard
                key={`${item.type}-${item.slug}`}
                item={item}
                fetched={fetched[`${item.type}/${item.slug}`]}
                onRemove={() => remove(item.type, item.slug)}
              />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}

function WatchlistCard({
  item,
  fetched,
  onRemove,
}: {
  item: WatchlistItem;
  fetched?: FetchedData;
  onRemove: () => void;
}) {
  const typeInfo = ENTITY_TYPES[item.type as EntityType];
  const addedDate = new Date(item.addedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card className="flex flex-col group relative">
      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors"
        aria-label={`Remove ${item.name} from watchlist`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>

      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={cn(
            "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded",
            "bg-circuit/10 text-circuit",
          )}
        >
          {typeInfo?.label ?? item.type}
        </span>
        <span className="text-[10px] text-text-muted font-mono">
          added {addedDate}
        </span>
      </div>

      {/* Name */}
      <Link
        href={`/${item.type}/${item.slug}`}
        className="text-lg font-semibold text-text group-hover:text-circuit transition-colors mb-2"
      >
        {item.name}
      </Link>

      {/* Score */}
      <div className="mt-auto pt-3 flex items-center justify-between">
        <span className="text-xs font-mono text-text-muted">composite</span>
        {fetched?.loading ? (
          <span className="text-xs font-mono text-text-muted animate-pulse">...</span>
        ) : fetched?.scores ? (
          <span className="text-sm font-mono text-circuit">{fetched.scores.composite}</span>
        ) : (
          <span className="text-xs font-mono text-text-muted">--</span>
        )}
      </div>
    </Card>
  );
}
