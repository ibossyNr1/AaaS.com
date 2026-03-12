"use client";

import { useState, type FormEvent } from "react";
import { Card, Badge, Button, Section, Container, cn } from "@aaas/ui";
import { CodeExample } from "@/components/code-example";

const labelCx = "text-xs font-mono uppercase tracking-wider text-text-muted";
const inputCx =
  "w-full bg-surface border border-border rounded-lg py-2.5 px-4 text-sm text-text placeholder:text-text-muted/50 focus:outline-none focus:border-circuit/50 focus:ring-1 focus:ring-circuit/20 transition-colors";

interface ApiKeyInfo {
  id: string;
  key?: string;
  keyPrefix: string;
  name: string;
  status: string;
  requestCount: number;
  rateLimit: number;
  createdAt: string;
  lastUsedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Sections nav                                                       */
/* ------------------------------------------------------------------ */

const NAV_SECTIONS = [
  { id: "api-reference", label: "API Reference" },
  { id: "export-tools", label: "Export Tools" },
  { id: "code-examples", label: "Code Examples" },
  { id: "api-keys", label: "API Keys" },
  { id: "webhooks", label: "Webhooks" },
  { id: "rate-limits", label: "Rate Limits" },
] as const;

/* ------------------------------------------------------------------ */
/*  Export formats                                                     */
/* ------------------------------------------------------------------ */

const EXPORT_ENDPOINTS = [
  {
    label: "Entities (JSON)",
    url: "/api/export/entities?format=json",
    description: "All entities as JSON array",
    badge: "JSON",
  },
  {
    label: "Entities (CSV)",
    url: "/api/export/entities?format=csv",
    description: "All entities as CSV spreadsheet",
    badge: "CSV",
  },
  {
    label: "Entities (JSONL)",
    url: "/api/export/entities?format=jsonl",
    description: "All entities as newline-delimited JSON (for LLM/ML pipelines)",
    badge: "JSONL",
  },
  {
    label: "Leaderboard (JSON)",
    url: "/api/export/leaderboard?format=json&category=all",
    description: "Full leaderboard with scores and rankings",
    badge: "JSON",
  },
  {
    label: "Leaderboard (CSV)",
    url: "/api/export/leaderboard?format=csv&category=all",
    description: "Leaderboard as CSV spreadsheet",
    badge: "CSV",
  },
  {
    label: "Changelog (JSON)",
    url: "/api/export/changelog?format=json",
    description: "Entity change history with diffs",
    badge: "JSON",
  },
  {
    label: "Changelog (CSV)",
    url: "/api/export/changelog?format=csv",
    description: "Change history as CSV spreadsheet",
    badge: "CSV",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  API Endpoints reference                                            */
/* ------------------------------------------------------------------ */

const API_ENDPOINTS = [
  { method: "GET", path: "/api/entities", description: "List and filter entities", params: "?type=tool&limit=50&channel=ai-tools" },
  { method: "GET", path: "/api/entity/:type/:slug", description: "Get a single entity by type and slug", params: "" },
  { method: "GET", path: "/api/search", description: "Full-text search across all entities", params: "?q=langchain&type=tool" },
  { method: "GET", path: "/api/leaderboard/:category", description: "Leaderboard rankings by category", params: "?limit=25" },
  { method: "GET", path: "/api/trending", description: "Trending entities by recent activity", params: "?limit=10" },
  { method: "GET", path: "/api/export/entities", description: "Export entities in JSON, CSV, or JSONL", params: "?format=json&type=model&fields=name,provider,composite" },
  { method: "GET", path: "/api/export/leaderboard", description: "Export leaderboard data", params: "?format=csv&category=all" },
  { method: "GET", path: "/api/export/changelog", description: "Export entity change history", params: "?format=json&since=2026-01-01&type=tool" },
  { method: "POST", path: "/api/submit", description: "Submit a new entity for review", params: "" },
  { method: "GET", path: "/api/entity/:type/:slug/changelog", description: "Get changelog for a specific entity", params: "" },
  { method: "GET", path: "/api/entity/:type/:slug/similar", description: "Find similar entities", params: "?limit=5" },
  { method: "GET", path: "/api/feed", description: "RSS feed of all changes", params: "" },
  { method: "GET", path: "/api/openapi", description: "OpenAPI 3.0 spec (machine-readable)", params: "" },
  { method: "POST", path: "/api/webhooks", description: "Register a webhook endpoint", params: "" },
  { method: "GET", path: "/api/developer/api-keys", description: "List your API keys (masked)", params: "" },
  { method: "POST", path: "/api/developer/api-keys", description: "Generate a new API key", params: "" },
  { method: "DELETE", path: "/api/developer/api-keys", description: "Revoke an API key", params: "" },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function DeveloperClient() {
  // --- Register state ---
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDescription, setRegDescription] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{ id: string; key: string; keyPrefix: string; name: string; rateLimit: number; createdAt: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // --- Manage state ---
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  // --- Webhook state ---
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEvents, setWebhookEvents] = useState<string[]>(["entity.created", "entity.updated"]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [webhookError, setWebhookError] = useState<string | null>(null);

  // --- Active nav ---
  const [activeNav, setActiveNav] = useState("api-reference");

  /* ---------------------------------------------------------------- */
  /*  Register handler                                                 */
  /* ---------------------------------------------------------------- */

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setRegError(null);
    setNewKey(null);

    const name = regName.trim();
    const email = regEmail.trim();

    if (!name || name.length < 3 || name.length > 50) {
      setRegError("Name is required (3-50 characters).");
      return;
    }
    if (!email || !email.includes("@")) {
      setRegError("A valid email address is required.");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          description: regDescription.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 201) {
        setNewKey(data);
        setRegName("");
        setRegEmail("");
        setRegDescription("");
      } else {
        setRegError(data.error ?? `Registration failed (${res.status}).`);
      }
    } catch {
      setRegError("Network error — could not reach the API.");
    } finally {
      setRegLoading(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Lookup handler                                                   */
  /* ---------------------------------------------------------------- */

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setHasSearched(false);

    const email = lookupEmail.trim();
    if (!email || !email.includes("@")) {
      setLookupError("Enter a valid email address.");
      return;
    }

    setLookupLoading(true);
    try {
      const res = await fetch(`/api/keys?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (res.ok) {
        setKeys(data.keys ?? []);
        setHasSearched(true);
      } else {
        setLookupError(data.error ?? `Lookup failed (${res.status}).`);
      }
    } catch {
      setLookupError("Network error — could not reach the API.");
    } finally {
      setLookupLoading(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Revoke handler                                                   */
  /* ---------------------------------------------------------------- */

  async function handleRevoke(keyId: string) {
    const apiKey = prompt("Enter your full API key to confirm revocation:");
    if (!apiKey) return;

    setRevoking(keyId);
    try {
      const res = await fetch(`/api/keys/${keyId}`, {
        method: "DELETE",
        headers: { "x-api-key": apiKey },
      });

      const data = await res.json();

      if (res.ok) {
        setKeys((prev) =>
          prev.map((k) => (k.id === keyId ? { ...k, status: "revoked" } : k)),
        );
      } else {
        alert(data.error ?? "Revocation failed.");
      }
    } catch {
      alert("Network error — could not reach the API.");
    } finally {
      setRevoking(null);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Webhook handler                                                  */
  /* ---------------------------------------------------------------- */

  async function handleWebhookRegister(e: FormEvent) {
    e.preventDefault();
    setWebhookError(null);
    setWebhookSuccess(false);

    const url = webhookUrl.trim();
    if (!url || !url.startsWith("https://")) {
      setWebhookError("Webhook URL must be a valid HTTPS URL.");
      return;
    }

    if (webhookEvents.length === 0) {
      setWebhookError("Select at least one event type.");
      return;
    }

    setWebhookLoading(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: webhookEvents }),
      });

      if (res.ok) {
        setWebhookSuccess(true);
        setWebhookUrl("");
      } else {
        const data = await res.json();
        setWebhookError(data.error ?? "Failed to register webhook.");
      }
    } catch {
      setWebhookError("Network error — could not reach the API.");
    } finally {
      setWebhookLoading(false);
    }
  }

  function toggleWebhookEvent(event: string) {
    setWebhookEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Copy helper                                                      */
  /* ---------------------------------------------------------------- */

  function copyKey() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <>
      {/* Hero */}
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
            Developer Portal
          </p>
          <h1 className="text-3xl font-bold text-text mb-4">
            API &amp; Developer Tools
          </h1>
          <p className="text-text-muted leading-relaxed max-w-2xl">
            Access the AaaS Knowledge Index programmatically. Export data in
            multiple formats, integrate via REST API, manage API keys, and
            configure webhooks for real-time updates.
          </p>
        </Container>
      </Section>

      {/* Sidebar nav + content */}
      <Section className="pb-20">
        <Container className="max-w-5xl">
          <div className="flex gap-8">
            {/* Sidebar */}
            <nav className="hidden lg:block w-48 shrink-0 sticky top-24 self-start">
              <ul className="space-y-1">
                {NAV_SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      onClick={() => setActiveNav(s.id)}
                      className={cn(
                        "block px-3 py-2 text-xs font-mono rounded-lg transition-colors",
                        activeNav === s.id
                          ? "bg-circuit/10 text-circuit"
                          : "text-text-muted hover:text-text hover:bg-surface",
                      )}
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-12">

              {/* ============================================ */}
              {/*  API Reference                                */}
              {/* ============================================ */}
              <section id="api-reference">
                <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
                  API Reference
                </h2>

                <Card className="mb-6">
                  <div className="space-y-5">
                    {/* Base URL */}
                    <div>
                      <p className={cn(labelCx, "mb-1.5")}>Base URL</p>
                      <div className="bg-surface rounded-lg p-3 font-mono text-sm text-text">
                        https://aaas.blog/api
                      </div>
                    </div>

                    {/* Authentication */}
                    <div>
                      <p className={cn(labelCx, "mb-1.5")}>Authentication</p>
                      <div className="bg-surface rounded-lg p-3 font-mono text-sm text-text">
                        x-api-key: aaas_your_key_here
                      </div>
                      <p className="text-xs text-text-muted mt-1.5">
                        Pass your API key in the <code className="text-circuit font-mono">x-api-key</code> header.
                        Anonymous access is rate-limited to 20 requests/day per IP.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Endpoint table */}
                <Card>
                  <p className={cn(labelCx, "mb-3")}>Available Endpoints</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 pr-3 font-mono text-xs text-text-muted w-16">Method</th>
                          <th className="pb-2 pr-3 font-mono text-xs text-text-muted">Endpoint</th>
                          <th className="pb-2 pr-3 font-mono text-xs text-text-muted hidden sm:table-cell">Params</th>
                          <th className="pb-2 font-mono text-xs text-text-muted">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-text">
                        {API_ENDPOINTS.map((ep, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50 last:border-0"
                          >
                            <td className="py-2 pr-3">
                              <span
                                className={cn(
                                  "inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                                  ep.method === "GET" && "bg-emerald-500/10 text-emerald-400",
                                  ep.method === "POST" && "bg-sky-500/10 text-sky-400",
                                  ep.method === "DELETE" && "bg-red-500/10 text-red-400",
                                )}
                              >
                                {ep.method}
                              </span>
                            </td>
                            <td className="py-2 pr-3 font-mono text-xs">{ep.path}</td>
                            <td className="py-2 pr-3 font-mono text-[10px] text-text-muted hidden sm:table-cell">
                              {ep.params}
                            </td>
                            <td className="py-2 text-xs text-text-muted">{ep.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </section>

              {/* ============================================ */}
              {/*  Export Tools                                  */}
              {/* ============================================ */}
              <section id="export-tools">
                <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
                  Export Tools
                </h2>

                <Card>
                  <p className="text-sm text-text-muted mb-6">
                    Download bulk data from the Knowledge Index. Use JSONL format
                    for LLM fine-tuning and ML pipelines.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {EXPORT_ENDPOINTS.map((exp) => (
                      <a
                        key={exp.url}
                        href={exp.url}
                        download
                        className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-circuit/30 hover:bg-circuit/5 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text group-hover:text-circuit transition-colors">
                            {exp.label}
                          </p>
                          <p className="text-xs text-text-muted truncate">{exp.description}</p>
                        </div>
                        <Badge>{exp.badge}</Badge>
                      </a>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <p className={cn(labelCx, "mb-2")}>Custom Export</p>
                    <p className="text-xs text-text-muted mb-3">
                      Filter by type and select specific fields:
                    </p>
                    <div className="bg-surface rounded-lg p-3 font-mono text-xs text-text overflow-x-auto">
                      GET /api/export/entities?format=jsonl&amp;type=model&amp;fields=name,provider,composite,adoption
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      Available fields:{" "}
                      <code className="text-circuit font-mono text-[10px]">
                        slug, type, name, provider, description, category, version, pricingModel, license, url, tags, capabilities, composite, adoption, quality, freshness, citations, engagement, addedDate, lastUpdated
                      </code>
                    </p>
                  </div>
                </Card>
              </section>

              {/* ============================================ */}
              {/*  Code Examples                                */}
              {/* ============================================ */}
              <section id="code-examples">
                <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
                  Code Examples
                </h2>

                <div className="space-y-6">
                  <CodeExample
                    endpoint="/api/entities"
                    method="GET"
                    description="List all entities, optionally filtering by type. Returns paginated results sorted by composite score."
                    queryParams={{ type: "tool", limit: "10" }}
                  />

                  <CodeExample
                    endpoint="/api/search"
                    method="GET"
                    description="Full-text search across all entity types. Returns matching entities ranked by relevance."
                    queryParams={{ q: "langchain", type: "tool" }}
                  />

                  <CodeExample
                    endpoint="/api/submit"
                    method="POST"
                    description="Submit a new entity for review. Requires authentication. The entity will be reviewed before appearing in the index."
                    body={{
                      type: "tool",
                      name: "My Tool",
                      provider: "Acme Corp",
                      description: "A great AI tool for building agents",
                      category: "ai-tools",
                      url: "https://example.com",
                      tags: ["ai", "agents", "automation"],
                    }}
                  />

                  <CodeExample
                    endpoint="/api/export/entities"
                    method="GET"
                    description="Export all entities in JSONL format for ML pipelines. Filter by type and select specific fields."
                    queryParams={{ format: "jsonl", type: "model", fields: "name,provider,composite" }}
                  />

                  <CodeExample
                    endpoint="/api/webhooks"
                    method="POST"
                    description="Register a webhook endpoint to receive real-time notifications when entities are created or updated."
                    body={{
                      url: "https://your-app.com/webhooks/aaas",
                      events: ["entity.created", "entity.updated"],
                    }}
                  />

                  <CodeExample
                    endpoint="/api/developer/api-keys"
                    method="POST"
                    description="Generate a new API key. Requires authentication with an existing key. Max 5 active keys per account."
                    body={{ name: "production-key" }}
                  />
                </div>
              </section>

              {/* ============================================ */}
              {/*  API Keys                                     */}
              {/* ============================================ */}
              <section id="api-keys">
                <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
                  API Key Management
                </h2>

                {/* Register */}
                <Card className="mb-6">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-5">
                    Register for API Key
                  </h3>

                  {regError && (
                    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
                      {regError}
                    </div>
                  )}

                  {newKey && (
                    <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
                      <p className="text-sm text-emerald-400 font-semibold">
                        API key created successfully
                      </p>
                      <div className="bg-surface rounded-lg p-3 font-mono text-sm text-text break-all select-all">
                        {newKey.key}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={copyKey}
                          className="text-xs font-mono text-circuit hover:underline"
                        >
                          {copied ? "Copied!" : "Copy to clipboard"}
                        </button>
                      </div>
                      <p className="text-xs text-red-400 font-mono">
                        WARNING: This key will not be shown again. Save it now.
                      </p>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-5">
                    <div>
                      <label htmlFor="reg-name" className={labelCx}>
                        Name <span className="text-accent-red">*</span>
                      </label>
                      <input
                        id="reg-name"
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Your name or app name (3-50 chars)"
                        className={cn(inputCx, "mt-1.5")}
                        required
                        minLength={3}
                        maxLength={50}
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-email" className={labelCx}>
                        Email <span className="text-accent-red">*</span>
                      </label>
                      <input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@example.com"
                        className={cn(inputCx, "mt-1.5")}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="reg-description" className={labelCx}>
                        Description{" "}
                        <span className="normal-case tracking-normal text-text-muted/60">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        id="reg-description"
                        value={regDescription}
                        onChange={(e) => setRegDescription(e.target.value)}
                        placeholder="What will you use this key for?"
                        rows={2}
                        className={cn(inputCx, "mt-1.5 resize-y")}
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={regLoading}
                        className="w-full sm:w-auto"
                      >
                        {regLoading ? "Generating..." : "Generate API Key"}
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Manage */}
                <Card>
                  <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-5">
                    Your API Keys
                  </h3>

                  {lookupError && (
                    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
                      {lookupError}
                    </div>
                  )}

                  <form onSubmit={handleLookup} className="flex gap-3 mb-6">
                    <input
                      type="email"
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      placeholder="Enter your email to look up keys"
                      className={cn(inputCx, "flex-1")}
                      required
                    />
                    <Button
                      type="submit"
                      variant="secondary"
                      disabled={lookupLoading}
                      className="shrink-0"
                    >
                      {lookupLoading ? "Loading..." : "Look up"}
                    </Button>
                  </form>

                  {hasSearched && keys.length === 0 && (
                    <p className="text-sm text-text-muted text-center py-4">
                      No API keys found for this email.
                    </p>
                  )}

                  {keys.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Key</th>
                            <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Name</th>
                            <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Status</th>
                            <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Requests</th>
                            <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Created</th>
                            <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Last Used</th>
                            <th className="pb-2 font-mono text-xs text-text-muted" />
                          </tr>
                        </thead>
                        <tbody className="text-text">
                          {keys.map((k) => (
                            <tr key={k.id} className="border-b border-border/50 last:border-0">
                              <td className="py-2.5 pr-4 font-mono text-xs">{k.keyPrefix}...</td>
                              <td className="py-2.5 pr-4 text-xs">{k.name}</td>
                              <td className="py-2.5 pr-4">
                                <span
                                  className={cn(
                                    "inline-block px-2 py-0.5 rounded-full text-xs font-mono",
                                    k.status === "active"
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                      : "bg-red-500/10 text-red-400 border border-red-500/30",
                                  )}
                                >
                                  {k.status}
                                </span>
                              </td>
                              <td className="py-2.5 pr-4 font-mono text-xs">{k.requestCount}</td>
                              <td className="py-2.5 pr-4 text-xs text-text-muted">
                                {new Date(k.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 pr-4 text-xs text-text-muted">
                                {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                              </td>
                              <td className="py-2.5">
                                {k.status === "active" && (
                                  <button
                                    onClick={() => handleRevoke(k.id)}
                                    disabled={revoking === k.id}
                                    className="text-xs font-mono text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                                  >
                                    {revoking === k.id ? "Revoking..." : "Revoke"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </section>

              {/* ============================================ */}
              {/*  Webhooks                                     */}
              {/* ============================================ */}
              <section id="webhooks">
                <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
                  Webhook Registration
                </h2>

                <Card>
                  <p className="text-sm text-text-muted mb-6">
                    Register a webhook to receive real-time POST notifications
                    when entities change. Your endpoint must accept HTTPS POST
                    requests and respond with a 2xx status.
                  </p>

                  {webhookError && (
                    <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-mono">
                      {webhookError}
                    </div>
                  )}

                  {webhookSuccess && (
                    <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400 font-mono">
                      Webhook registered successfully.
                    </div>
                  )}

                  <form onSubmit={handleWebhookRegister} className="space-y-5">
                    <div>
                      <label htmlFor="webhook-url" className={labelCx}>
                        Endpoint URL <span className="text-accent-red">*</span>
                      </label>
                      <input
                        id="webhook-url"
                        type="url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        placeholder="https://your-app.com/webhooks/aaas"
                        className={cn(inputCx, "mt-1.5")}
                        required
                      />
                    </div>

                    <div>
                      <p className={cn(labelCx, "mb-2")}>Event Types</p>
                      <div className="flex flex-wrap gap-2">
                        {["entity.created", "entity.updated", "entity.deleted", "leaderboard.updated", "changelog.new"].map(
                          (event) => (
                            <button
                              key={event}
                              type="button"
                              onClick={() => toggleWebhookEvent(event)}
                              className={cn(
                                "px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors",
                                webhookEvents.includes(event)
                                  ? "bg-circuit/10 text-circuit border-circuit/30"
                                  : "bg-surface text-text-muted border-border hover:border-circuit/20",
                              )}
                            >
                              {event}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        variant="secondary"
                        disabled={webhookLoading}
                        className="w-full sm:w-auto"
                      >
                        {webhookLoading ? "Registering..." : "Register Webhook"}
                      </Button>
                    </div>
                  </form>

                  <div className="mt-6 pt-4 border-t border-border">
                    <p className={cn(labelCx, "mb-2")}>Webhook Payload Example</p>
                    <div className="bg-surface rounded-lg p-3 font-mono text-xs text-text overflow-x-auto whitespace-pre">
{`{
  "event": "entity.updated",
  "timestamp": "2026-03-12T14:30:00Z",
  "entity": {
    "type": "tool",
    "slug": "langchain",
    "name": "LangChain"
  },
  "changes": [
    { "field": "version", "old": "0.1.0", "new": "0.2.0" }
  ]
}`}
                    </div>
                  </div>
                </Card>
              </section>

              {/* ============================================ */}
              {/*  Rate Limits                                  */}
              {/* ============================================ */}
              <section id="rate-limits">
                <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-6">
                  Rate Limits &amp; Quotas
                </h2>

                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Tier</th>
                          <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Limit</th>
                          <th className="pb-2 pr-4 font-mono text-xs text-text-muted">Window</th>
                          <th className="pb-2 font-mono text-xs text-text-muted">Auth</th>
                        </tr>
                      </thead>
                      <tbody className="text-text">
                        <tr className="border-b border-border/50">
                          <td className="py-2.5 pr-4 text-sm">Anonymous</td>
                          <td className="py-2.5 pr-4 font-mono text-circuit">20</td>
                          <td className="py-2.5 pr-4 text-xs text-text-muted">per day (UTC)</td>
                          <td className="py-2.5 text-xs text-text-muted">IP-based</td>
                        </tr>
                        <tr className="border-b border-border/50">
                          <td className="py-2.5 pr-4 text-sm">Authenticated</td>
                          <td className="py-2.5 pr-4 font-mono text-circuit">100</td>
                          <td className="py-2.5 pr-4 text-xs text-text-muted">per day (UTC)</td>
                          <td className="py-2.5 text-xs text-text-muted">x-api-key header</td>
                        </tr>
                        <tr className="last:border-0">
                          <td className="py-2.5 pr-4 text-sm">Enterprise</td>
                          <td className="py-2.5 pr-4 font-mono text-circuit">Custom</td>
                          <td className="py-2.5 pr-4 text-xs text-text-muted">Custom</td>
                          <td className="py-2.5 text-xs text-text-muted">Contact us</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <p className={cn(labelCx, "mb-2")}>Rate Limit Headers</p>
                    <p className="text-xs text-text-muted mb-3">
                      Every API response includes rate limit information in the headers:
                    </p>
                    <div className="bg-surface rounded-lg p-3 font-mono text-xs text-text space-y-1">
                      <p><span className="text-circuit">X-RateLimit-Limit:</span> 100</p>
                      <p><span className="text-circuit">X-RateLimit-Remaining:</span> 87</p>
                      <p><span className="text-circuit">X-RateLimit-Reset:</span> 1741996799</p>
                    </div>
                    <p className="text-xs text-text-muted mt-2">
                      The <code className="font-mono text-circuit">Reset</code> value is a Unix
                      epoch timestamp for end-of-day UTC when the counter resets.
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <p className={cn(labelCx, "mb-2")}>Key Limits</p>
                    <ul className="text-xs text-text-muted space-y-1.5 list-disc list-inside">
                      <li>Maximum <span className="text-circuit font-mono">5</span> active API keys per account</li>
                      <li>Keys can be revoked at any time via the management panel or API</li>
                      <li>Rate limit resets daily at <span className="text-circuit font-mono">00:00 UTC</span></li>
                      <li>Export endpoints count toward your daily rate limit</li>
                      <li>Contact <span className="text-circuit">hello@superforge.dev</span> for enterprise limits</li>
                    </ul>
                  </div>
                </Card>
              </section>

            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
