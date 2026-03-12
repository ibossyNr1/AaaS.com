"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, Badge, cn } from "@aaas/ui";
import type { EntityCollection } from "@/lib/collections";

// ── Props ──────────────────────────────────────────────────────────────

interface CollectionsClientProps {
  collections: EntityCollection[];
}

// ── Component ──────────────────────────────────────────────────────────

export function CollectionsClient({ collections }: CollectionsClientProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Extract all unique tags across collections
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    collections.forEach((c) => c.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [collections]);

  // Filter collections
  const filtered = useMemo(() => {
    let result = collections;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (selectedTag !== "all") {
      result = result.filter((c) => c.tags?.includes(selectedTag));
    }

    return result;
  }, [collections, search, selectedTag]);

  return (
    <div className="space-y-6">
      {/* ---- Search & Filter ---- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 bg-surface border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-circuit/50 transition-colors"
        />

        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="bg-surface border border-border rounded px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-text-muted focus:outline-none focus:border-circuit/50 transition-colors appearance-none pr-7 cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 8px center",
          }}
        >
          <option value="all">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* ---- Result Count ---- */}
      <p className="text-xs font-mono uppercase tracking-wider text-text-muted">
        Showing{" "}
        <span className={cn("font-bold", filtered.length > 0 && "text-circuit")}>
          {filtered.length}
        </span>{" "}
        {filtered.length === 1 ? "collection" : "collections"}
      </p>

      {/* ---- Grid ---- */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((col) => (
            <Link key={col.id} href={`/collections/${col.id}`}>
              <Card variant="glass" className="p-5 h-full hover:border-circuit/40 transition-colors">
                {/* Cover image */}
                {col.coverImage && (
                  <div className="h-32 rounded-md mb-4 overflow-hidden bg-surface">
                    <img
                      src={col.coverImage}
                      alt={col.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Name */}
                <h3 className="text-lg font-semibold text-text mb-1 line-clamp-1">
                  {col.name}
                </h3>

                {/* Description */}
                <p className="text-text-muted text-sm mb-3 line-clamp-2">
                  {col.description || "No description"}
                </p>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                  <span className="font-mono">
                    {col.entities?.length || 0} {(col.entities?.length || 0) === 1 ? "entity" : "entities"}
                  </span>
                  <span className="text-border">|</span>
                  <span className="font-mono">by {col.createdBy}</span>
                </div>

                {/* Tags */}
                {col.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {col.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="circuit" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                    {col.tags.length > 4 && (
                      <span className="text-[10px] text-text-muted font-mono">
                        +{col.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg py-16 text-center">
          <p className="text-text-muted text-sm mb-2">
            No collections match the current filters.
          </p>
          <p className="text-text-muted/60 text-xs">
            Try adjusting your search or tag filter.
          </p>
        </div>
      )}
    </div>
  );
}
