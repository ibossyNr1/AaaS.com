"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, Badge, Button, cn } from "@aaas/ui";
import type { EntityType } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface EntityRow {
  slug: string;
  type: EntityType;
  name: string;
  provider: string;
  compositeScore: number;
  schemaCompleteness: number;
  lastVerified: string | null;
  status: "active" | "stale" | "broken";
}

interface EntitiesResponse {
  entities: EntityRow[];
  total: number;
  page: number;
  pageSize: number;
}

type SortField = "name" | "type" | "provider" | "compositeScore" | "schemaCompleteness" | "lastVerified" | "status";
type SortDir = "asc" | "desc";

const ENTITY_TYPES: EntityType[] = ["tool", "model", "agent", "skill", "script", "benchmark"];
const STATUS_OPTIONS = ["all", "active", "stale", "broken"] as const;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatDate(iso: string | null): string {
  if (!iso) return "--";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-emerald-500";
    case "stale":
      return "text-amber-500";
    case "broken":
      return "text-red-500";
    default:
      return "text-text-muted";
  }
}

/* -------------------------------------------------------------------------- */
/*  Inline Edit Cell                                                           */
/* -------------------------------------------------------------------------- */

function EditableCell({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={cn(
          "bg-surface border border-border rounded px-1.5 py-0.5 text-xs font-mono text-text w-full outline-none focus:border-circuit",
          className,
        )}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-pointer hover:text-circuit transition-colors",
        className,
      )}
      title="Click to edit"
    >
      {value || "--"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                             */
/* -------------------------------------------------------------------------- */

export function EntitiesClient() {
  const [entities, setEntities] = useState<EntityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("compositeScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<string | null>(null);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortField,
        sortDir,
      });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/entities?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: EntitiesResponse = await res.json();
      setEntities(data.entities);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load entities");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, typeFilter, statusFilter, sortField, sortDir]);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  /* Sort toggle */
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  /* Selection */
  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === entities.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entities.map((e) => `${e.type}/${e.slug}`)));
    }
  };

  /* Bulk actions */
  const executeBulk = async (action: string) => {
    if (selected.size === 0) return;
    setBulkAction(action);

    const items = Array.from(selected).map((key) => {
      const [type, slug] = key.split("/");
      return { type, slug };
    });

    try {
      if (action === "delete") {
        await Promise.all(
          items.map((item) =>
            fetch(`/api/admin/entities?type=${item.type}&slug=${item.slug}`, {
              method: "DELETE",
            }),
          ),
        );
      } else if (action === "re-verify" || action === "enrich") {
        await Promise.all(
          items.map((item) =>
            fetch("/api/admin/entities", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: item.type,
                slug: item.slug,
                action,
              }),
            }),
          ),
        );
      }

      setSelected(new Set());
      fetchEntities();
    } catch {
      // silent
    } finally {
      setBulkAction(null);
    }
  };

  /* Inline edit */
  const updateField = async (type: string, slug: string, field: string, value: string) => {
    try {
      await fetch("/api/admin/entities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, slug, fields: { [field]: value } }),
      });
      fetchEntities();
    } catch {
      // silent
    }
  };

  /* Sort indicator */
  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return <span className="ml-1 text-circuit">{sortDir === "asc" ? "^" : "v"}</span>;
  };

  const totalPages = Math.ceil(total / pageSize);

  /* Error state */
  if (error && entities.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-sm font-mono text-accent-red mb-2">Failed to load entities</p>
        <p className="text-xs text-text-muted">{error}</p>
        <button
          onClick={fetchEntities}
          className="mt-4 text-xs font-mono uppercase tracking-wider text-circuit hover:underline"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Filters ---- */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Type filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text outline-none focus:border-circuit"
          >
            <option value="all">All</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-surface border border-border rounded px-2 py-1 text-xs font-mono text-text outline-none focus:border-circuit"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-mono text-text-muted">
              {selected.size} selected
            </span>
            <Button
              variant="red"
              size="sm"
              onClick={() => executeBulk("delete")}
              disabled={!!bulkAction}
            >
              {bulkAction === "delete" ? "Deleting..." : "Delete"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => executeBulk("re-verify")}
              disabled={!!bulkAction}
            >
              {bulkAction === "re-verify" ? "Verifying..." : "Re-verify"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => executeBulk("enrich")}
              disabled={!!bulkAction}
            >
              {bulkAction === "enrich" ? "Enriching..." : "Enrich"}
            </Button>
          </div>
        )}

        {/* Count */}
        <span className="text-xs font-mono text-text-muted ml-auto">
          {total} entities
        </span>
      </div>

      {/* ---- Table ---- */}
      <Card className="overflow-x-auto !p-0">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface/30">
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={entities.length > 0 && selected.size === entities.length}
                  onChange={toggleSelectAll}
                  className="accent-circuit"
                />
              </th>
              {(
                [
                  ["name", "Name"],
                  ["type", "Type"],
                  ["provider", "Provider"],
                  ["compositeScore", "Score"],
                  ["schemaCompleteness", "Complete"],
                  ["lastVerified", "Verified"],
                  ["status", "Status"],
                ] as [SortField, string][]
              ).map(([field, label]) => (
                <th
                  key={field}
                  onClick={() => toggleSort(field)}
                  className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-text-muted cursor-pointer hover:text-circuit select-none"
                >
                  {label}
                  {sortIndicator(field)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && entities.length === 0 ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={8} className="px-3 py-3">
                    <div className="animate-pulse bg-surface rounded h-4" />
                  </td>
                </tr>
              ))
            ) : entities.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center text-text-muted text-sm">
                  No entities found matching the current filters.
                </td>
              </tr>
            ) : (
              entities.map((entity) => {
                const key = `${entity.type}/${entity.slug}`;
                return (
                  <tr
                    key={key}
                    className={cn(
                      "border-b border-border hover:bg-surface/30 transition-colors",
                      selected.has(key) && "bg-circuit/5",
                    )}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggleSelect(key)}
                        className="accent-circuit"
                      />
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-text font-semibold">
                      <EditableCell
                        value={entity.name}
                        onSave={(v) => updateField(entity.type, entity.slug, "name", v)}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="circuit">{entity.type}</Badge>
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-text-muted">
                      <EditableCell
                        value={entity.provider}
                        onSave={(v) => updateField(entity.type, entity.slug, "provider", v)}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-text font-bold">
                      {entity.compositeScore}
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-text-muted">
                      {entity.schemaCompleteness}%
                    </td>
                    <td className="px-3 py-2 text-xs font-mono text-text-muted">
                      {formatDate(entity.lastVerified)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "text-[10px] font-mono uppercase tracking-wider",
                          statusColor(entity.status),
                        )}
                      >
                        {entity.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      {/* ---- Pagination ---- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-xs font-mono text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
