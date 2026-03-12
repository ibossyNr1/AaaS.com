"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, Button, cn } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Submission {
  id: string;
  entity: Record<string, unknown>;
  status: string;
  submittedAt: string;
  submittedBy: string;
  reviewScore?: number;
  reviewNotes?: string;
}

interface Suggestion {
  id: string;
  entityName: string;
  entityCollection: string;
  entityId: string;
  currentCategory: string;
  suggestedCategory: string;
  currentScore: number;
  suggestedScore: number;
  status: string;
  createdAt: string;
}

type Tab = "submissions" | "suggestions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReviewClient() {
  const [token, setToken] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [tab, setTab] = useState<Tab>("submissions");

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsError, setSubsError] = useState<string | null>(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggsLoading, setSuggsLoading] = useState(false);
  const [suggsError, setSuggsError] = useState<string | null>(null);

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("aaas-admin-token");
    if (stored && stored.trim().length > 0) {
      setToken(stored);
    }
  }, []);

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    if (!token) return;
    setSubsLoading(true);
    setSubsError(null);
    try {
      const res = await fetch("/api/admin/submissions?status=pending", {
        headers: { "x-api-key": token },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setSubmissions(data.submissions ?? []);
    } catch (err) {
      setSubsError(err instanceof Error ? err.message : "Failed to fetch submissions");
    } finally {
      setSubsLoading(false);
    }
  }, [token]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!token) return;
    setSuggsLoading(true);
    setSuggsError(null);
    try {
      const res = await fetch("/api/admin/suggestions", {
        headers: { "x-api-key": token },
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      setSuggsError(err instanceof Error ? err.message : "Failed to fetch suggestions");
    } finally {
      setSuggsLoading(false);
    }
  }, [token]);

  // Load data when token is set or tab changes
  useEffect(() => {
    if (!token) return;
    if (tab === "submissions") fetchSubmissions();
    else fetchSuggestions();
  }, [token, tab, fetchSubmissions, fetchSuggestions]);

  // Handle submission approve/reject
  async function handleSubmissionAction(id: string, status: "approved" | "rejected", reason?: string) {
    if (!token) return;
    setActionLoading(id);
    try {
      const body: Record<string, string> = { status };
      if (reason) body.reason = reason;

      const res = await fetch(`/api/submit/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": token,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status} ${res.statusText}`);
      }

      setRejectingId(null);
      setRejectReason("");
      await fetchSubmissions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  // Handle suggestion accept/dismiss
  async function handleSuggestionAction(id: string, action: "accept" | "dismiss") {
    if (!token) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/suggestions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": token,
        },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `${res.status} ${res.statusText}`);
      }

      await fetchSuggestions();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  // Handle token submit
  function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tokenInput.trim().length === 0) return;
    localStorage.setItem("aaas-admin-token", tokenInput.trim());
    setToken(tokenInput.trim());
  }

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base p-4">
        <Card className="max-w-md w-full">
          <h1 className="text-lg font-mono uppercase tracking-wider text-circuit mb-4">
            Admin Access
          </h1>
          <p className="text-sm text-text-muted mb-6">
            Enter your admin token to access the review queue.
          </p>
          <form onSubmit={handleTokenSubmit} className="space-y-4">
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="Admin token"
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg text-text text-sm font-mono focus:outline-none focus:border-circuit transition-colors"
            />
            <Button type="submit" variant="secondary" size="sm" className="w-full">
              Authenticate
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-base">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-2">
            Admin
          </p>
          <h1 className="text-2xl font-bold text-text">Review Queue</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          {(["submissions", "suggestions"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px",
                tab === t
                  ? "text-circuit border-circuit"
                  : "text-text-muted border-transparent hover:text-text",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Submissions Tab */}
        {tab === "submissions" && (
          <div className="space-y-4">
            {subsLoading && (
              <p className="text-sm text-text-muted font-mono">Loading submissions...</p>
            )}
            {subsError && (
              <p className="text-sm text-accent-red font-mono">{subsError}</p>
            )}
            {!subsLoading && !subsError && submissions.length === 0 && (
              <Card>
                <p className="text-sm text-text-muted">No pending submissions.</p>
              </Card>
            )}
            {submissions.map((sub) => {
              const entity = sub.entity ?? {};
              const name = (entity.name as string) || "Unnamed";
              const type = (entity.type as string) || "unknown";
              const desc = (entity.description as string) || "";
              const source = sub.submittedBy || "unknown";
              const isRejecting = rejectingId === sub.id;
              const isLoading = actionLoading === sub.id;

              return (
                <Card key={sub.id} className="space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-text truncate">
                          {name}
                        </h3>
                        <span className="shrink-0 px-2 py-0.5 text-xs font-mono uppercase tracking-wider text-circuit bg-circuit/10 rounded">
                          {type}
                        </span>
                      </div>
                      <p className="text-sm text-text-muted line-clamp-2">{desc}</p>
                    </div>
                    {sub.reviewScore !== undefined && (
                      <span
                        className={cn(
                          "shrink-0 text-xs font-mono px-2 py-1 rounded",
                          sub.reviewScore >= 70
                            ? "text-green-400 bg-green-400/10"
                            : sub.reviewScore >= 40
                              ? "text-yellow-400 bg-yellow-400/10"
                              : "text-accent-red bg-accent-red/10",
                        )}
                      >
                        {sub.reviewScore}/100
                      </span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted font-mono">
                    <span>Source: {source}</span>
                    <span>{formatDate(sub.submittedAt)}</span>
                    {sub.reviewNotes && (
                      <span className="text-yellow-400">Note: {sub.reviewNotes}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => handleSubmissionAction(sub.id, "approved")}
                      className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                    >
                      {isLoading && actionLoading === sub.id ? "..." : "Approve"}
                    </Button>

                    {!isRejecting ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => {
                          setRejectingId(sub.id);
                          setRejectReason("");
                        }}
                        className="text-accent-red hover:text-accent-red"
                      >
                        Reject
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason (optional)"
                          className="flex-1 px-3 py-1.5 bg-surface border border-border rounded text-text text-xs font-mono focus:outline-none focus:border-accent-red transition-colors"
                        />
                        <Button
                          variant="red"
                          size="sm"
                          disabled={isLoading}
                          onClick={() =>
                            handleSubmissionAction(sub.id, "rejected", rejectReason || undefined)
                          }
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRejectingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Suggestions Tab */}
        {tab === "suggestions" && (
          <div className="space-y-4">
            {suggsLoading && (
              <p className="text-sm text-text-muted font-mono">Loading suggestions...</p>
            )}
            {suggsError && (
              <p className="text-sm text-accent-red font-mono">{suggsError}</p>
            )}
            {!suggsLoading && !suggsError && suggestions.length === 0 && (
              <Card>
                <p className="text-sm text-text-muted">No pending categorization suggestions.</p>
              </Card>
            )}
            {suggestions.map((sug) => {
              const isLoading = actionLoading === sug.id;

              return (
                <Card key={sug.id} className="space-y-3">
                  {/* Header */}
                  <div>
                    <h3 className="text-base font-semibold text-text mb-1">
                      {sug.entityName}
                    </h3>
                    <p className="text-xs text-text-muted font-mono">
                      {sug.entityCollection}/{sug.entityId}
                    </p>
                  </div>

                  {/* Category change */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="px-2 py-0.5 font-mono text-xs rounded bg-surface border border-border text-text-muted">
                      {sug.currentCategory}
                    </span>
                    <span className="text-text-muted">&rarr;</span>
                    <span className="px-2 py-0.5 font-mono text-xs rounded bg-circuit/10 border border-circuit/20 text-circuit">
                      {sug.suggestedCategory}
                    </span>
                  </div>

                  {/* Confidence */}
                  <div className="flex gap-x-4 text-xs text-text-muted font-mono">
                    <span>Current score: {sug.currentScore}</span>
                    <span>Suggested score: {sug.suggestedScore}</span>
                    <span>
                      Confidence: {sug.currentScore > 0
                        ? `${(sug.suggestedScore / sug.currentScore).toFixed(1)}x`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => handleSuggestionAction(sug.id, "accept")}
                      className="border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                    >
                      {isLoading ? "..." : "Accept"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLoading}
                      onClick={() => handleSuggestionAction(sug.id, "dismiss")}
                    >
                      Dismiss
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
