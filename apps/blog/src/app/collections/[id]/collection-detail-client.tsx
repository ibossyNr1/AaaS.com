"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, Badge, Button, cn } from "@aaas/ui";
import type { EntityCollection, CollectionEntity } from "@/lib/collections";
import { ENTITY_TYPES, type EntityType } from "@/lib/types";

// ── Props ──────────────────────────────────────────────────────────────

interface CollectionDetailClientProps {
  collection: EntityCollection;
}

// ── Component ──────────────────────────────────────────────────────────

export function CollectionDetailClient({ collection: initial }: CollectionDetailClientProps) {
  const [collection, setCollection] = useState(initial);
  const [addSlug, setAddSlug] = useState("");
  const [addType, setAddType] = useState<string>("tool");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const entities = [...(collection.entities || [])].sort(
    (a, b) => a.position - b.position,
  );

  // ── Add entity ────────────────────────────────────────────────────

  const handleAdd = useCallback(async () => {
    if (!addSlug.trim()) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/collections/${collection.id}/entities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "current-user" },
        body: JSON.stringify({ entitySlug: addSlug.trim(), entityType: addType }),
      });
      if (res.ok) {
        // Refresh collection
        const colRes = await fetch(`/api/collections/${collection.id}`);
        const { data } = await colRes.json();
        if (data) setCollection(data);
        setAddSlug("");
      }
    } finally {
      setAdding(false);
    }
  }, [addSlug, addType, collection.id]);

  // ── Remove entity ─────────────────────────────────────────────────

  const handleRemove = useCallback(
    async (entity: CollectionEntity) => {
      const key = `${entity.entityType}:${entity.entitySlug}`;
      setRemoving(key);
      try {
        const res = await fetch(
          `/api/collections/${collection.id}/entities?entitySlug=${entity.entitySlug}&entityType=${entity.entityType}`,
          {
            method: "DELETE",
            headers: { "x-user-id": "current-user" },
          },
        );
        if (res.ok) {
          const colRes = await fetch(`/api/collections/${collection.id}`);
          const { data } = await colRes.json();
          if (data) setCollection(data);
        }
      } finally {
        setRemoving(null);
      }
    },
    [collection.id],
  );

  // ── Reorder (move up / move down) ─────────────────────────────────

  const handleMove = useCallback(
    async (index: number, direction: "up" | "down") => {
      const newEntities = [...entities];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= newEntities.length) return;

      [newEntities[index], newEntities[swapIndex]] = [newEntities[swapIndex], newEntities[index]];

      const entityOrder = newEntities.map((e) => `${e.entityType}:${e.entitySlug}`);

      await fetch(`/api/collections/${collection.id}/entities`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-user-id": "current-user" },
        body: JSON.stringify({ entityOrder }),
      });

      const colRes = await fetch(`/api/collections/${collection.id}`);
      const { data } = await colRes.json();
      if (data) setCollection(data);
    },
    [entities, collection.id],
  );

  return (
    <div className="space-y-8">
      {/* ---- Header ---- */}
      <div>
        <Link
          href="/collections"
          className="text-xs font-mono uppercase tracking-wider text-circuit hover:underline mb-4 inline-block"
        >
          &larr; All Collections
        </Link>

        {collection.coverImage && (
          <div className="h-48 rounded-lg mb-6 overflow-hidden bg-surface">
            <img
              src={collection.coverImage}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
          {collection.name}
        </h1>

        {collection.description && (
          <p className="text-text-muted text-sm mb-4 max-w-2xl">
            {collection.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
          <span>{entities.length} {entities.length === 1 ? "entity" : "entities"}</span>
          <span className="text-border">|</span>
          <span>by {collection.createdBy}</span>
          {collection.isPublic && (
            <>
              <span className="text-border">|</span>
              <Badge variant="circuit" className="text-[10px]">Public</Badge>
            </>
          )}
        </div>

        {collection.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {collection.tags.map((tag) => (
              <Badge key={tag} variant="circuit" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* ---- Add Entity ---- */}
      <Card variant="glass" className="p-4">
        <h3 className="text-sm font-semibold text-text mb-3">Add Entity</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full">
            <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">
              Entity Slug
            </label>
            <input
              type="text"
              placeholder="e.g. openai-gpt-4"
              value={addSlug}
              onChange={(e) => setAddSlug(e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-text placeholder:text-text-muted/60 focus:outline-none focus:border-circuit/50 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-text-muted block mb-1">
              Type
            </label>
            <select
              value={addType}
              onChange={(e) => setAddType(e.target.value)}
              className="bg-surface border border-border rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-circuit/50 transition-colors appearance-none pr-7 cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 8px center",
              }}
            >
              {Object.entries(ENTITY_TYPES).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={adding || !addSlug.trim()}
            className="whitespace-nowrap"
          >
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>
      </Card>

      {/* ---- Entity List ---- */}
      {entities.length > 0 ? (
        <div className="space-y-2">
          {entities.map((entity, index) => {
            const key = `${entity.entityType}:${entity.entitySlug}`;
            const typeInfo = ENTITY_TYPES[entity.entityType as EntityType];
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
                {/* Position & reorder */}
                <div className="flex flex-col items-center gap-0.5 min-w-[28px]">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className={cn(
                      "text-text-muted hover:text-circuit transition-colors text-xs leading-none",
                      index === 0 && "opacity-30 cursor-not-allowed",
                    )}
                    aria-label="Move up"
                  >
                    &#9650;
                  </button>
                  <span className="text-xs font-mono text-text-muted">{index + 1}</span>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === entities.length - 1}
                    className={cn(
                      "text-text-muted hover:text-circuit transition-colors text-xs leading-none",
                      index === entities.length - 1 && "opacity-30 cursor-not-allowed",
                    )}
                    aria-label="Move down"
                  >
                    &#9660;
                  </button>
                </div>

                {/* Entity info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Link
                      href={`/${entity.entityType}/${entity.entitySlug}`}
                      className="text-sm font-semibold text-text hover:text-circuit transition-colors truncate"
                    >
                      {entity.entitySlug}
                    </Link>
                    {typeInfo && (
                      <Badge variant="circuit" className="text-[10px] shrink-0">
                        {typeInfo.label}
                      </Badge>
                    )}
                  </div>
                  {entity.note && (
                    <p className="text-xs text-text-muted truncate">{entity.note}</p>
                  )}
                  <p className="text-[10px] text-text-muted/60 font-mono mt-0.5">
                    Added by {entity.addedBy} on {new Date(entity.addedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemove(entity)}
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
            This collection is empty.
          </p>
          <p className="text-text-muted/60 text-xs">
            Use the form above to add entities.
          </p>
        </div>
      )}
    </div>
  );
}
