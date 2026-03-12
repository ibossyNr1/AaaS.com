"use client";

import { useState, useCallback, type FormEvent } from "react";
import { Card, Button, cn } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  lastDelivery: string | null;
  failureCount: number;
}

interface DeliveryResult {
  webhookId: string;
  status: number | "error";
  timestamp: string;
  payload: string;
}

const EVENT_OPTIONS = [
  { value: "entity.created", label: "Entity Created" },
  { value: "entity.updated", label: "Entity Updated" },
  { value: "entity.deleted", label: "Entity Deleted" },
  { value: "score.changed", label: "Score Changed" },
  { value: "submission.approved", label: "Submission Approved" },
  { value: "submission.rejected", label: "Submission Rejected" },
  { value: "digest.published", label: "Digest Published" },
  { value: "trending.alert", label: "Trending Alert" },
];

const labelCx = "text-xs font-mono uppercase tracking-wider text-text-muted";
const inputCx =
  "w-full bg-surface border border-border rounded-lg py-2.5 px-4 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-circuit/50 focus:ring-1 focus:ring-circuit/20 transition-colors";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WebhooksClient() {
  // Auth
  const [apiKey, setApiKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // Webhook list
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  // Create form
  const [newUrl, setNewUrl] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [newEvents, setNewEvents] = useState<Set<string>>(new Set());
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState<string | null>(null);

  // Test
  const [testing, setTesting] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<DeliveryResult[]>([]);

  // -----------------------------------------------------------------------
  // Auth & Fetch
  // -----------------------------------------------------------------------

  const fetchWebhooks = useCallback(
    async (key?: string) => {
      const k = key ?? apiKey;
      setListLoading(true);
      setListError(null);

      try {
        const res = await fetch("/api/webhooks/manage", {
          headers: { "x-api-key": k },
        });
        const data = await res.json();

        if (res.ok) {
          setWebhooks(data.webhooks ?? []);
          setAuthenticated(true);
        } else {
          setListError(data.error ?? `Failed (${res.status})`);
        }
      } catch {
        setListError("Network error — could not reach the API.");
      } finally {
        setListLoading(false);
      }
    },
    [apiKey],
  );

  function handleAuth(e: FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    fetchWebhooks(apiKey.trim());
  }

  // -----------------------------------------------------------------------
  // Create webhook
  // -----------------------------------------------------------------------

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(false);

    if (!newUrl.trim()) {
      setCreateError("URL is required.");
      return;
    }
    if (newEvents.size === 0) {
      setCreateError("Select at least one event type.");
      return;
    }
    if (!newSecret.trim() || newSecret.trim().length < 8) {
      setCreateError("Secret must be at least 8 characters.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/webhooks/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          url: newUrl.trim(),
          events: Array.from(newEvents),
          secret: newSecret.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        setCreateSuccess(true);
        setNewUrl("");
        setNewSecret("");
        setNewEvents(new Set());
        fetchWebhooks();
      } else {
        setCreateError(data.error ?? `Failed (${res.status})`);
      }
    } catch {
      setCreateError("Network error — could not reach the API.");
    } finally {
      setCreateLoading(false);
    }
  }

  // -----------------------------------------------------------------------
  // Delete webhook
  // -----------------------------------------------------------------------

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/webhooks/manage?id=${id}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey },
      });
      const data = await res.json();

      if (res.ok) {
        setWebhooks((prev) => prev.filter((w) => w.id !== id));
      } else {
        alert(data.error ?? "Delete failed.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeleting(null);
    }
  }

  // -----------------------------------------------------------------------
  // Test webhook
  // -----------------------------------------------------------------------

  async function handleTest(webhook: Webhook) {
    setTesting(webhook.id);

    const testPayload = {
      event: "entity.updated",
      timestamp: new Date().toISOString(),
      data: {
        type: "tool",
        slug: "test-entity",
        name: "Test Entity",
        message: "This is a test webhook delivery from the AaaS Knowledge Index.",
      },
    };

    try {
      // We simulate a test by sending a POST to the webhook URL directly
      // In production, this would go through the queue. For test, we do a
      // direct client-side fetch (will be blocked by CORS in most cases,
      // so we show the payload that would be sent).
      const result: DeliveryResult = {
        webhookId: webhook.id,
        status: "error",
        timestamp: new Date().toISOString(),
        payload: JSON.stringify(testPayload, null, 2),
      };

      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testPayload),
          mode: "no-cors",
        });
        result.status = res.status || 0;
      } catch {
        result.status = "error";
      }

      setTestResults((prev) => [result, ...prev].slice(0, 20));
    } finally {
      setTesting(null);
    }
  }

  // -----------------------------------------------------------------------
  // Event toggle
  // -----------------------------------------------------------------------

  function toggleEvent(event: string) {
    setNewEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) {
        next.delete(event);
      } else {
        next.add(event);
      }
      return next;
    });
  }

  // -----------------------------------------------------------------------
  // Render — Auth Gate
  // -----------------------------------------------------------------------

  if (!authenticated) {
    return (
      <Card>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
          Authenticate
        </h2>
        <p className="text-sm text-text-muted mb-6">
          Enter your API key to manage webhooks. You can get one from the{" "}
          <a href="/developer" className="text-circuit hover:underline">
            Developer Portal
          </a>
          .
        </p>

        {listError && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
            {listError}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex gap-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="aaas_your_api_key"
            className={cn(inputCx, "flex-1")}
            required
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={listLoading}
            className="shrink-0"
          >
            {listLoading ? "Verifying..." : "Authenticate"}
          </Button>
        </form>
      </Card>
    );
  }

  // -----------------------------------------------------------------------
  // Render — Authenticated
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Registered webhooks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit">
            Your Webhooks
          </h2>
          <button
            onClick={() => fetchWebhooks()}
            className="text-xs font-mono text-text-muted hover:text-circuit transition-colors"
          >
            Refresh
          </button>
        </div>

        {webhooks.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-text-muted">
              No webhooks registered yet. Create one below.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {webhooks.map((wh) => (
              <Card key={wh.id} className="!p-0">
                <div className="px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-grow">
                      <p className="text-sm font-mono text-text truncate">
                        {wh.url}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {wh.events.map((ev) => (
                          <span
                            key={ev}
                            className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-border text-text-muted"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded-full text-xs font-mono",
                          wh.active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30",
                        )}
                      >
                        {wh.active ? "active" : "inactive"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <span className="text-[10px] font-mono text-text-muted">
                      Created{" "}
                      {new Date(wh.createdAt).toLocaleDateString()}
                    </span>
                    {wh.lastDelivery && (
                      <span className="text-[10px] font-mono text-text-muted">
                        Last delivery{" "}
                        {new Date(wh.lastDelivery).toLocaleDateString()}
                      </span>
                    )}
                    {wh.failureCount > 0 && (
                      <span className="text-[10px] font-mono text-red-400">
                        {wh.failureCount} failure
                        {wh.failureCount !== 1 ? "s" : ""}
                      </span>
                    )}

                    <div className="flex-grow" />

                    <button
                      onClick={() => handleTest(wh)}
                      disabled={testing === wh.id}
                      className="text-xs font-mono text-circuit hover:underline disabled:opacity-50"
                    >
                      {testing === wh.id ? "Testing..." : "Test"}
                    </button>
                    <button
                      onClick={() => handleDelete(wh.id)}
                      disabled={deleting === wh.id}
                      className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      {deleting === wh.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create new webhook */}
      <Card>
        <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
          Register New Webhook
        </h2>

        {createError && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
            {createError}
          </div>
        )}

        {createSuccess && (
          <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 font-mono">
            Webhook registered successfully.
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-5">
          <div>
            <label htmlFor="wh-url" className={labelCx}>
              Endpoint URL <span className="text-accent-red">*</span>
            </label>
            <input
              id="wh-url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              className={cn(inputCx, "mt-1.5")}
              required
            />
          </div>

          <div>
            <label className={labelCx}>
              Event Types <span className="text-accent-red">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EVENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleEvent(opt.value)}
                  className={cn(
                    "text-xs font-mono px-3 py-1.5 rounded-full border transition-colors",
                    newEvents.has(opt.value)
                      ? "border-circuit text-circuit bg-circuit/10"
                      : "border-border text-text-muted hover:text-text hover:border-text-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (newEvents.size === EVENT_OPTIONS.length) {
                    setNewEvents(new Set());
                  } else {
                    setNewEvents(new Set(EVENT_OPTIONS.map((o) => o.value)));
                  }
                }}
                className="text-xs font-mono px-3 py-1.5 rounded-full border border-dashed border-border text-text-muted hover:text-circuit hover:border-circuit transition-colors"
              >
                {newEvents.size === EVENT_OPTIONS.length
                  ? "Clear All"
                  : "Select All"}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="wh-secret" className={labelCx}>
              Signing Secret <span className="text-accent-red">*</span>
            </label>
            <input
              id="wh-secret"
              type="password"
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              placeholder="Minimum 8 characters — used for HMAC-SHA256 signature"
              className={cn(inputCx, "mt-1.5")}
              required
              minLength={8}
            />
            <p className="text-[10px] text-text-muted mt-1.5 font-mono">
              Payloads are signed with HMAC-SHA256. Verify using the
              X-Signature-256 header.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="secondary"
              disabled={createLoading}
              className="w-full sm:w-auto"
            >
              {createLoading ? "Registering..." : "Register Webhook"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Test delivery history */}
      {testResults.length > 0 && (
        <div>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">
            Test Delivery History
          </h2>
          <Card className="!p-0 overflow-hidden">
            {testResults.map((result, i) => (
              <div
                key={`${result.webhookId}-${i}`}
                className="px-4 py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center justify-between gap-4 mb-2">
                  <span className="text-xs font-mono text-text-muted truncate">
                    {result.webhookId}
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={cn(
                        "inline-block px-2 py-0.5 rounded text-[10px] font-mono",
                        typeof result.status === "number" &&
                          result.status >= 200 &&
                          result.status < 300
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400",
                      )}
                    >
                      {result.status === "error"
                        ? "CORS/Error"
                        : `${result.status}`}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <details className="group">
                  <summary className="text-[10px] font-mono text-text-muted cursor-pointer hover:text-circuit transition-colors">
                    View payload
                  </summary>
                  <pre className="mt-2 p-3 bg-surface rounded text-[10px] font-mono text-text overflow-x-auto">
                    {result.payload}
                  </pre>
                </details>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
