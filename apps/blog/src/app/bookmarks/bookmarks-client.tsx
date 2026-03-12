"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card, Badge, cn } from "@aaas/ui";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";
import type { Bookmark } from "@/lib/collections";

// ── Component ──────────────────────────────────────────────────────────

export function BookmarksClient() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [removing, setRemoving] = useState<string | null>(null);

  // ── Fetch bookmarks ───────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/bookmarks", {
          headers: { "x-user-id": "current-user" },
        });
        if (res.ok) {
          const { data } = await res.json();
          setBookmarks(data || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Filter by type ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (typeFilter === "all") return bookmarks;
    return bookmarks.filter((b) => b.entityType === typeFilter);
  }, [bookmarks, typeFilter]);

  // ── Remove bookmark ───────────────────────────────────────────────

  const handleRemove = useCallback(async (bookmark: Bookmark) => {
    const key = `${bookmark.entityType}:${bookmark.entitySlug}`;
    setRemoving(key);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "current-user" },
        body: JSON.stringify({
          entitySlug: bookmark.entitySlug,
          entityType: bookmark.entityType,
        }),
      });
      if (res.ok) {
        setBookmarks((prev) =>
          prev.filter(
            (b) =>
              !(b.entitySlug === bookmark.entitySlug && b.entityType === bookmark.entityType),
          ),
        );
      }
    } finally {
      setRemoving(null);
    }
  }, []);

  // ── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-surface animate-pulse border border-border"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Type Filter ---- */}
      <div className="flex items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-muted focus:outline-none focus:border-circuit/50 transition-colors appearance-none pr-7 cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          <option value="all">All Types</option>
          {Object.entries(ENTITY_TYPES).map(([key, val]) => (
            <option key={key} value={key}>
              {val.plural}
            </option>
          ))}
        </select>

        <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
          <span className={cn("font-bold", filtered.length > 0 && "text-circuit")}>
            {filtered.length}
          </span>{" "}
          {filtered.length === 1 ? "bookmark" : "bookmarks"}
        </p>
      </div>

      {/* ---- Bookmarks List ---- */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((bookmark) => {
            const key = `${bookmark.entityType}:${bookmark.entitySlug}`;
            const typeInfo = ENTITY_TYPES[bookmark.entityType as EntityType];
            const isRemoving = removing === key;

            return (
              <Card
                key={key}
                variant="glass"
                className={cn(
                  "p-4 flex items-center gap-4",
                  isRemoving && "opacity-50 pointer-events-none",
                )}
              >
                {/* Bookmark icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-circuit shrink-0"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>

                {/* Entity info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/${bookmark.entityType}/${bookmark.entitySlug}`}
                      className="text-sm font-semibold text-text hover:text-circuit transition-colors truncate"
                    >
                      {bookmark.entitySlug}
                    </Link>
                    {typeInfo && (
                      <Badge variant="circuit" className="text-[10px] shrink-0">
                        {typeInfo.label}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted/60 font-mono">
                    Saved on {new Date(bookmark.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(bookmark)}
                  className="text-text-muted hover:text-red-400 transition-colors text-xs font-mono uppercase tracking-wider shrink-0"
                >
                  Remove
                </button>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="border border-border rounded-lg py-16 text-center">
          <p className="text-text-muted text-sm mb-2">
            No bookmarks yet.
          </p>
          <p className="text-text-muted/60 text-xs">
            Bookmark entities from their detail pages to save them here.
          </p>
        </div>
      )}
    </div>
  );
}
