"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "@aaas/ui";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Parameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: { type?: string; enum?: string[]; default?: unknown; format?: string; minimum?: number; maximum?: number };
  description?: string;
}

interface ResponseDef {
  description: string;
  content?: Record<string, { schema?: unknown }>;
}

interface Operation {
  tags?: string[];
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: unknown }>;
  };
  responses?: Record<string, ResponseDef>;
  security?: unknown[];
}

interface PathItem {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  patch?: Operation;
}

interface OpenAPISpec {
  info: { title: string; description: string; version: string };
  servers?: { url: string }[];
  tags?: { name: string; description?: string }[];
  paths: Record<string, PathItem>;
  components?: { securitySchemes?: unknown; schemas?: unknown };
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const METHOD_COLORS: Record<string, string> = {
  get: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  post: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  put: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  delete: "bg-red-500/20 text-red-400 border-red-500/30",
  patch: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border",
        METHOD_COLORS[method] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30",
      )}
    >
      {method}
    </span>
  );
}

function JsonViewer({ data, collapsed: initialCollapsed = true }: { data: unknown; collapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const text = JSON.stringify(data, null, 2);

  return (
    <div className="relative">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="text-xs font-mono text-text-muted hover:text-circuit transition-colors mb-1"
      >
        {collapsed ? "[+] Show schema" : "[-] Hide schema"}
      </button>
      {!collapsed && (
        <pre className="bg-surface border border-border rounded p-3 text-xs font-mono text-text overflow-x-auto max-h-80">
          {text}
        </pre>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Try It Panel                                                              */
/* -------------------------------------------------------------------------- */

function TryItPanel({
  method,
  path,
  parameters,
  hasBody,
  baseUrl,
}: {
  method: string;
  path: string;
  parameters: Parameter[];
  hasBody: boolean;
  baseUrl: string;
}) {
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [bodyText, setBodyText] = useState("{}");
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState<{
    status: number;
    headers: Record<string, string>;
    body: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = useCallback(async () => {
    setLoading(true);
    setResponse(null);

    try {
      // Build URL
      let url = baseUrl + path;
      const queryParts: string[] = [];

      for (const param of parameters) {
        const val = paramValues[param.name];
        if (!val) continue;
        if (param.in === "path") {
          url = url.replace(`{${param.name}}`, encodeURIComponent(val));
        } else if (param.in === "query") {
          queryParts.push(`${encodeURIComponent(param.name)}=${encodeURIComponent(val)}`);
        }
      }

      if (queryParts.length > 0) {
        url += "?" + queryParts.join("&");
      }

      const headers: Record<string, string> = {};
      if (apiKey.trim()) {
        headers["x-api-key"] = apiKey.trim();
      }
      if (hasBody && method !== "get") {
        headers["Content-Type"] = "application/json";
      }

      const opts: RequestInit = {
        method: method.toUpperCase(),
        headers,
      };

      if (hasBody && method !== "get") {
        opts.body = bodyText;
      }

      const res = await fetch(url, opts);

      const rateLimitHeaders: Record<string, string> = {};
      for (const key of ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset", "content-type"]) {
        const val = res.headers.get(key);
        if (val) rateLimitHeaders[key] = val;
      }

      let body: string;
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json")) {
        const json = await res.json();
        body = JSON.stringify(json, null, 2);
      } else if (ct.includes("xml") || ct.includes("svg")) {
        body = await res.text();
      } else {
        body = await res.text();
      }

      setResponse({ status: res.status, headers: rateLimitHeaders, body });
    } catch (err) {
      setResponse({
        status: 0,
        headers: {},
        body: `Request failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    } finally {
      setLoading(false);
    }
  }, [baseUrl, path, parameters, paramValues, apiKey, hasBody, method, bodyText]);

  return (
    <div className="mt-4 border border-border rounded-lg p-4 bg-surface/50">
      <h4 className="text-sm font-mono font-semibold text-text mb-3">Try it</h4>

      {/* API Key */}
      <div className="mb-3">
        <label className="block text-xs font-mono text-text-muted mb-1">x-api-key (optional)</label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="aaas_..."
          className="w-full bg-base border border-border rounded px-3 py-1.5 text-sm font-mono text-text placeholder:text-text-muted/50 focus:outline-none focus:border-circuit"
        />
      </div>

      {/* Parameters */}
      {parameters.map((param) => (
        <div key={param.name} className="mb-3">
          <label className="block text-xs font-mono text-text-muted mb-1">
            {param.name}
            {param.required && <span className="text-red-400 ml-1">*</span>}
            <span className="ml-2 opacity-60">({param.in})</span>
          </label>
          {param.schema?.enum ? (
            <select
              value={paramValues[param.name] || ""}
              onChange={(e) =>
                setParamValues((p) => ({ ...p, [param.name]: e.target.value }))
              }
              className="w-full bg-base border border-border rounded px-3 py-1.5 text-sm font-mono text-text focus:outline-none focus:border-circuit"
            >
              <option value="">-- select --</option>
              {param.schema.enum.map((v: string) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={paramValues[param.name] || ""}
              onChange={(e) =>
                setParamValues((p) => ({ ...p, [param.name]: e.target.value }))
              }
              placeholder={param.schema?.default !== undefined ? String(param.schema.default) : ""}
              className="w-full bg-base border border-border rounded px-3 py-1.5 text-sm font-mono text-text placeholder:text-text-muted/50 focus:outline-none focus:border-circuit"
            />
          )}
        </div>
      ))}

      {/* Request body */}
      {hasBody && method !== "get" && (
        <div className="mb-3">
          <label className="block text-xs font-mono text-text-muted mb-1">Request body (JSON)</label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={6}
            className="w-full bg-base border border-border rounded px-3 py-2 text-sm font-mono text-text placeholder:text-text-muted/50 focus:outline-none focus:border-circuit resize-y"
          />
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={loading}
        className={cn(
          "px-4 py-2 rounded font-mono text-sm font-semibold transition-colors",
          loading
            ? "bg-border text-text-muted cursor-wait"
            : "bg-circuit/20 text-circuit border border-circuit/30 hover:bg-circuit/30",
        )}
      >
        {loading ? "Sending..." : "Send Request"}
      </button>

      {/* Response */}
      {response && (
        <div className="mt-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-mono text-text-muted">Status:</span>
            <span
              className={cn(
                "text-sm font-mono font-bold",
                response.status >= 200 && response.status < 300
                  ? "text-emerald-400"
                  : response.status >= 400
                    ? "text-red-400"
                    : "text-amber-400",
              )}
            >
              {response.status || "ERR"}
            </span>
          </div>
          {Object.keys(response.headers).length > 0 && (
            <div className="mb-2">
              <span className="text-xs font-mono text-text-muted block mb-1">Headers:</span>
              <pre className="bg-base border border-border rounded p-2 text-xs font-mono text-text-muted overflow-x-auto">
                {Object.entries(response.headers)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join("\n")}
              </pre>
            </div>
          )}
          <span className="text-xs font-mono text-text-muted block mb-1">Body:</span>
          <pre className="bg-base border border-border rounded p-3 text-xs font-mono text-text overflow-x-auto max-h-96">
            {response.body}
          </pre>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Endpoint Card                                                             */
/* -------------------------------------------------------------------------- */

function EndpointCard({
  method,
  path,
  operation,
  baseUrl,
}: {
  method: string;
  path: string;
  operation: Operation;
  baseUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const params = operation.parameters || [];
  const hasBody = !!operation.requestBody;
  const responses = operation.responses || {};
  const bodySchema: object | null = hasBody
    ? (Object.values(operation.requestBody?.content || {})[0]?.schema as object | undefined) ?? null
    : null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface/30 hover:bg-surface/60 transition-colors text-left"
      >
        <MethodBadge method={method} />
        <code className="text-sm font-mono text-text font-medium flex-1">{path}</code>
        <span className="text-sm text-text-muted hidden sm:inline">{operation.summary}</span>
        <span className="text-text-muted text-xs ml-2">{expanded ? "[-]" : "[+]"}</span>
      </button>

      {/* Detail */}
      {expanded && (
        <div className="px-4 py-4 border-t border-border space-y-4">
          {operation.description && (
            <p className="text-sm text-text-muted">{operation.description}</p>
          )}

          {/* Parameters table */}
          {params.length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Parameters</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 px-2 text-xs font-mono text-text-muted">Name</th>
                      <th className="text-left py-1.5 px-2 text-xs font-mono text-text-muted">In</th>
                      <th className="text-left py-1.5 px-2 text-xs font-mono text-text-muted">Type</th>
                      <th className="text-left py-1.5 px-2 text-xs font-mono text-text-muted">Req</th>
                      <th className="text-left py-1.5 px-2 text-xs font-mono text-text-muted">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((p) => (
                      <tr key={p.name} className="border-b border-border/50">
                        <td className="py-1.5 px-2 font-mono text-circuit text-xs">{p.name}</td>
                        <td className="py-1.5 px-2 font-mono text-text-muted text-xs">{p.in}</td>
                        <td className="py-1.5 px-2 font-mono text-text-muted text-xs">
                          {p.schema?.type || "string"}
                          {p.schema?.enum ? (
                            <span className="block text-text-muted/60 mt-0.5">
                              [{p.schema.enum.join(", ")}]
                            </span>
                          ) : null}
                        </td>
                        <td className="py-1.5 px-2 text-xs">
                          {p.required ? (
                            <span className="text-red-400">yes</span>
                          ) : (
                            <span className="text-text-muted">no</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 text-text-muted text-xs">{p.description || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Request body */}
          {bodySchema && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Request Body</h4>
              <JsonViewer data={bodySchema} />
            </div>
          )}

          {/* Responses */}
          {Object.keys(responses).length > 0 && (
            <div>
              <h4 className="text-xs font-mono uppercase tracking-wider text-text-muted mb-2">Responses</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 px-2 text-xs font-mono text-text-muted">Code</th>
                      <th className="text-left py-1.5 px-2 text-xs font-mono text-text-muted">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(responses).map(([code, def]) => (
                      <tr key={code} className="border-b border-border/50">
                        <td className="py-1.5 px-2 font-mono text-xs">
                          <span
                            className={cn(
                              "font-bold",
                              code.startsWith("2")
                                ? "text-emerald-400"
                                : code.startsWith("4")
                                  ? "text-amber-400"
                                  : "text-red-400",
                            )}
                          >
                            {code}
                          </span>
                        </td>
                        <td className="py-1.5 px-2 text-text-muted text-xs">{def.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Try it */}
          <TryItPanel
            method={method}
            path={path}
            parameters={params}
            hasBody={hasBody}
            baseUrl={baseUrl}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Component                                                            */
/* -------------------------------------------------------------------------- */

export function ApiDocsClient() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    fetch("/api/openapi")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setSpec(data);
        if (data.tags?.[0]) setActiveTag(data.tags[0].name);
      })
      .catch((err) => setError(err.message));
  }, []);

  const scrollToTag = useCallback((tag: string) => {
    setActiveTag(tag);
    setSidebarOpen(false);
    const el = sectionRefs.current[tag];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-400 font-mono text-sm mb-2">Failed to load API spec</p>
          <p className="text-text-muted text-xs font-mono">{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="min-h-screen bg-base flex items-center justify-center">
        <div className="text-circuit font-mono text-sm animate-pulse">Loading API spec...</div>
      </div>
    );
  }

  // Group endpoints by tag
  const tags = spec.tags || [];
  const grouped: Record<string, { method: string; path: string; operation: Operation }[]> = {};
  for (const tag of tags) {
    grouped[tag.name] = [];
  }

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    for (const method of ["get", "post", "put", "delete", "patch"] as const) {
      const op = pathItem[method];
      if (!op) continue;
      const tag = op.tags?.[0] || "Other";
      if (!grouped[tag]) grouped[tag] = [];
      grouped[tag].push({ method, path, operation: op });
    }
  }

  const baseUrl = spec.servers?.[0]?.url || "";

  return (
    <div className="min-h-screen bg-base pt-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-text mb-2">{spec.info.title}</h1>
          <p className="text-text-muted text-sm max-w-2xl">{spec.info.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs font-mono text-text-muted">
              v{spec.info.version}
            </span>
            <span className="text-xs font-mono text-circuit">{baseUrl}</span>
            <a
              href="/api/openapi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-text-muted hover:text-circuit transition-colors underline"
            >
              Raw OpenAPI JSON
            </a>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar — desktop */}
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {tags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => scrollToTag(tag.name)}
                  className={cn(
                    "block w-full text-left px-3 py-1.5 rounded text-sm font-mono transition-colors",
                    activeTag === tag.name
                      ? "bg-circuit/10 text-circuit"
                      : "text-text-muted hover:text-text hover:bg-surface/50",
                  )}
                >
                  {tag.name}
                  <span className="ml-1 text-xs opacity-60">({grouped[tag.name]?.length || 0})</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Mobile sidebar dropdown */}
          <div className="lg:hidden fixed bottom-4 right-4 z-30">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-circuit text-base px-4 py-2 rounded-full font-mono text-sm font-bold shadow-lg"
            >
              {sidebarOpen ? "Close" : "Sections"}
            </button>
            {sidebarOpen && (
              <div className="absolute bottom-12 right-0 bg-surface border border-border rounded-lg shadow-xl p-2 min-w-[180px]">
                {tags.map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => scrollToTag(tag.name)}
                    className={cn(
                      "block w-full text-left px-3 py-1.5 rounded text-sm font-mono transition-colors",
                      activeTag === tag.name
                        ? "bg-circuit/10 text-circuit"
                        : "text-text-muted hover:text-text",
                    )}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main content */}
          <main className="flex-1 min-w-0 pb-20 space-y-12">
            {tags.map((tag) => {
              const endpoints = grouped[tag.name] || [];
              if (endpoints.length === 0) return null;

              return (
                <section
                  key={tag.name}
                  id={slugify(tag.name)}
                  ref={(el) => {
                    sectionRefs.current[tag.name] = el;
                  }}
                  className="scroll-mt-24"
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-text">{tag.name}</h2>
                    {tag.description && (
                      <p className="text-sm text-text-muted mt-1">{tag.description}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    {endpoints.map(({ method, path, operation }) => (
                      <EndpointCard
                        key={`${method}-${path}`}
                        method={method}
                        path={path}
                        operation={operation}
                        baseUrl={baseUrl}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      </div>
    </div>
  );
}
