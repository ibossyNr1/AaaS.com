"use client";

import { useState, useCallback, useMemo } from "react";
import { Card, cn } from "@aaas/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Language = "curl" | "python" | "javascript" | "go";

interface CodeExampleProps {
  endpoint: string;
  method: string;
  description: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Code generators
// ---------------------------------------------------------------------------

function buildUrl(endpoint: string, queryParams?: Record<string, string>): string {
  const base = `https://aaas.blog${endpoint}`;
  if (!queryParams || Object.keys(queryParams).length === 0) return base;
  const qs = new URLSearchParams(queryParams).toString();
  return `${base}?${qs}`;
}

function generateCurl(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
): string {
  const url = buildUrl(endpoint, queryParams);
  const lines: string[] = [`curl -X ${method} "${url}"`];
  lines.push(`  -H "x-api-key: aaas_your_key_here"`);

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    lines.push(`  -H "Content-Type: application/json"`);
    lines.push(`  -d '${JSON.stringify(body, null, 2)}'`);
  }

  return lines.join(" \\\n");
}

function generatePython(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
): string {
  const url = buildUrl(endpoint, queryParams);
  const lines: string[] = [
    `import requests`,
    ``,
    `headers = {`,
    `    "x-api-key": "aaas_your_key_here",`,
    `}`,
    ``,
  ];

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    lines.push(`payload = ${JSON.stringify(body, null, 4)}`);
    lines.push(``);
    lines.push(`response = requests.${method.toLowerCase()}(`);
    lines.push(`    "${url}",`);
    lines.push(`    headers=headers,`);
    lines.push(`    json=payload,`);
    lines.push(`)`);
  } else {
    lines.push(`response = requests.${method.toLowerCase()}(`);
    lines.push(`    "${url}",`);
    lines.push(`    headers=headers,`);
    lines.push(`)`);
  }

  lines.push(``);
  lines.push(`data = response.json()`);
  lines.push(`print(data)`);

  return lines.join("\n");
}

function generateJavaScript(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
): string {
  const url = buildUrl(endpoint, queryParams);
  const lines: string[] = [];

  const hasBody = body && (method === "POST" || method === "PUT" || method === "PATCH");

  lines.push(`const response = await fetch("${url}", {`);
  lines.push(`  method: "${method}",`);

  if (hasBody) {
    lines.push(`  headers: {`);
    lines.push(`    "x-api-key": "aaas_your_key_here",`);
    lines.push(`    "Content-Type": "application/json",`);
    lines.push(`  },`);
    lines.push(`  body: JSON.stringify(${JSON.stringify(body, null, 4)}),`);
  } else {
    lines.push(`  headers: {`);
    lines.push(`    "x-api-key": "aaas_your_key_here",`);
    lines.push(`  },`);
  }

  lines.push(`});`);
  lines.push(``);
  lines.push(`const data = await response.json();`);
  lines.push(`console.log(data);`);

  return lines.join("\n");
}

function generateGo(
  endpoint: string,
  method: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
): string {
  const url = buildUrl(endpoint, queryParams);
  const hasBody = body && (method === "POST" || method === "PUT" || method === "PATCH");

  const lines: string[] = [
    `package main`,
    ``,
    `import (`,
    `\t"fmt"`,
    `\t"io"`,
    `\t"net/http"`,
  ];

  if (hasBody) {
    lines.push(`\t"bytes"`);
    lines.push(`\t"encoding/json"`);
  }

  lines.push(`)`);
  lines.push(``);
  lines.push(`func main() {`);

  if (hasBody) {
    lines.push(`\tpayload, _ := json.Marshal(map[string]interface{}{`);
    for (const [key, value] of Object.entries(body!)) {
      lines.push(`\t\t"${key}": ${JSON.stringify(value)},`);
    }
    lines.push(`\t})`);
    lines.push(``);
    lines.push(`\treq, _ := http.NewRequest("${method}", "${url}", bytes.NewBuffer(payload))`);
    lines.push(`\treq.Header.Set("Content-Type", "application/json")`);
  } else {
    lines.push(`\treq, _ := http.NewRequest("${method}", "${url}", nil)`);
  }

  lines.push(`\treq.Header.Set("x-api-key", "aaas_your_key_here")`);
  lines.push(``);
  lines.push(`\tclient := &http.Client{}`);
  lines.push(`\tresp, err := client.Do(req)`);
  lines.push(`\tif err != nil {`);
  lines.push(`\t\tfmt.Println("Error:", err)`);
  lines.push(`\t\treturn`);
  lines.push(`\t}`);
  lines.push(`\tdefer resp.Body.Close()`);
  lines.push(``);
  lines.push(`\tbody, _ := io.ReadAll(resp.Body)`);
  lines.push(`\tfmt.Println(string(body))`);
  lines.push(`}`);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Generators map
// ---------------------------------------------------------------------------

const generators: Record<
  Language,
  (endpoint: string, method: string, body?: Record<string, unknown>, queryParams?: Record<string, string>) => string
> = {
  curl: generateCurl,
  python: generatePython,
  javascript: generateJavaScript,
  go: generateGo,
};

const LANGUAGE_LABELS: Record<Language, string> = {
  curl: "cURL",
  python: "Python",
  javascript: "JavaScript",
  go: "Go",
};

const LANGUAGES: Language[] = ["curl", "python", "javascript", "go"];

// ---------------------------------------------------------------------------
// Tokenize code into styled spans (safe — no innerHTML)
// ---------------------------------------------------------------------------

interface CodeToken {
  text: string;
  className?: string;
}

const KEYWORD_MAP: Record<Language, Set<string>> = {
  python: new Set(["import", "from", "def", "return", "if", "else", "print", "True", "False", "None", "async", "await"]),
  javascript: new Set(["const", "let", "var", "await", "async", "function", "return", "if", "else", "console", "new", "import", "from"]),
  go: new Set(["package", "import", "func", "main", "if", "err", "nil", "return", "defer", "string", "interface"]),
  curl: new Set(["curl"]),
};

const CURL_FLAGS = new Set(["-X", "-H", "-d"]);

function tokenizeLine(line: string, lang: Language): CodeToken[] {
  const tokens: CodeToken[] = [];
  let i = 0;

  while (i < line.length) {
    // Comments
    if ((lang === "python" && line[i] === "#") || (lang !== "python" && line.slice(i, i + 2) === "//")) {
      tokens.push({ text: line.slice(i), className: "text-text-muted" });
      break;
    }

    // Strings (double-quoted)
    if (line[i] === '"') {
      let end = i + 1;
      while (end < line.length && line[end] !== '"') {
        if (line[end] === "\\") end++;
        end++;
      }
      end = Math.min(end + 1, line.length);
      tokens.push({ text: line.slice(i, end), className: "text-emerald-400" });
      i = end;
      continue;
    }

    // Strings (single-quoted)
    if (line[i] === "'") {
      let end = i + 1;
      while (end < line.length && line[end] !== "'") {
        if (line[end] === "\\") end++;
        end++;
      }
      end = Math.min(end + 1, line.length);
      tokens.push({ text: line.slice(i, end), className: "text-emerald-400" });
      i = end;
      continue;
    }

    // Backtick strings (JS)
    if (line[i] === "`") {
      let end = i + 1;
      while (end < line.length && line[end] !== "`") {
        if (line[end] === "\\") end++;
        end++;
      }
      end = Math.min(end + 1, line.length);
      tokens.push({ text: line.slice(i, end), className: "text-emerald-400" });
      i = end;
      continue;
    }

    // Words / identifiers
    if (/[a-zA-Z_]/.test(line[i])) {
      let end = i;
      while (end < line.length && /[a-zA-Z0-9_]/.test(line[end])) end++;
      const word = line.slice(i, end);
      const keywords = KEYWORD_MAP[lang];
      if (keywords?.has(word)) {
        tokens.push({ text: word, className: "text-purple-400" });
      } else {
        tokens.push({ text: word });
      }
      i = end;
      continue;
    }

    // Curl flags
    if (lang === "curl" && line[i] === "-" && i + 1 < line.length && /[a-zA-Z]/.test(line[i + 1])) {
      let end = i;
      while (end < line.length && /[a-zA-Z-]/.test(line[end])) end++;
      const flag = line.slice(i, end);
      if (CURL_FLAGS.has(flag)) {
        tokens.push({ text: flag, className: "text-sky-400" });
      } else {
        tokens.push({ text: flag });
      }
      i = end;
      continue;
    }

    // Default: single character
    tokens.push({ text: line[i] });
    i++;
  }

  return tokens;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CodeExample({ endpoint, method, description, body, queryParams }: CodeExampleProps) {
  const [lang, setLang] = useState<Language>("curl");
  const [copied, setCopied] = useState(false);

  const code = generators[lang](endpoint, method, body, queryParams);

  const tokenizedLines = useMemo(() => {
    return code.split("\n").map((line) => tokenizeLine(line, lang));
  }, [code, lang]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block px-2 py-0.5 rounded text-xs font-mono font-bold uppercase",
              method === "GET" && "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
              method === "POST" && "bg-sky-500/10 text-sky-400 border border-sky-500/30",
              method === "PUT" && "bg-amber-500/10 text-amber-400 border border-amber-500/30",
              method === "PATCH" && "bg-amber-500/10 text-amber-400 border border-amber-500/30",
              method === "DELETE" && "bg-red-500/10 text-red-400 border border-red-500/30",
            )}
          >
            {method}
          </span>
          <code className="text-sm font-mono text-text">{endpoint}</code>
        </div>
      </div>

      <p className="text-xs text-text-muted mb-4">{description}</p>

      {/* Language tabs */}
      <div className="flex items-center gap-1 mb-3 border-b border-border pb-2">
        {LANGUAGES.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={cn(
              "px-3 py-1.5 text-xs font-mono rounded-md transition-colors",
              lang === l
                ? "bg-circuit/10 text-circuit border border-circuit/30"
                : "text-text-muted hover:text-text hover:bg-surface",
            )}
          >
            {LANGUAGE_LABELS[l]}
          </button>
        ))}

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="ml-auto px-3 py-1.5 text-xs font-mono text-text-muted hover:text-circuit transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Code block */}
      <div className="bg-[rgb(var(--basalt-deep))] rounded-lg p-4 overflow-x-auto">
        <pre className="text-sm font-mono leading-relaxed">
          <code>
            {tokenizedLines.map((tokens, lineIdx) => (
              <span key={lineIdx}>
                {tokens.map((t, tIdx) => (
                  <span key={tIdx} className={t.className}>
                    {t.text}
                  </span>
                ))}
                {lineIdx < tokenizedLines.length - 1 && "\n"}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </Card>
  );
}
