"use client";

import { useEffect, useState } from "react";

interface KeyFact {
  label: string;
  value: string;
}

interface SummaryData {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  positioning: string;
  recommendation: string;
  keyFacts: KeyFact[];
  lastGenerated: string | { seconds: number };
  entityName: string;
}

interface EntitySummaryProps {
  type: string;
  slug: string;
}

function getGradeColor(recommendation: string): string {
  if (recommendation.startsWith("Best in class")) return "border-emerald-500/40 bg-emerald-500/5 text-emerald-300";
  if (recommendation.startsWith("Highly recommended")) return "border-emerald-400/30 bg-emerald-400/5 text-emerald-300";
  if (recommendation.startsWith("Solid choice")) return "border-blue-400/30 bg-blue-400/5 text-blue-300";
  if (recommendation.startsWith("Decent option")) return "border-amber-400/30 bg-amber-400/5 text-amber-300";
  if (recommendation.startsWith("Consider alternatives")) return "border-orange-400/30 bg-orange-400/5 text-orange-300";
  return "border-red-400/30 bg-red-400/5 text-red-300";
}

function Skeleton() {
  return (
    <section className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-xl border border-border/40 bg-surface/60 p-6 space-y-4 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded bg-text-muted/20" />
            <div className="h-5 w-28 rounded bg-text-muted/20" />
          </div>
          <div className="h-4 w-full rounded bg-text-muted/10" />
          <div className="h-4 w-3/4 rounded bg-text-muted/10" />
          <div className="flex gap-2 mt-4">
            <div className="h-6 w-20 rounded-full bg-text-muted/10" />
            <div className="h-6 w-24 rounded-full bg-text-muted/10" />
            <div className="h-6 w-16 rounded-full bg-text-muted/10" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function EntitySummary({ type, slug }: EntitySummaryProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      try {
        const res = await fetch(`/api/entity/${type}/${slug}/summary`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data && data.overview) {
          setSummary(data);
        }
      } catch {
        // Silently fail — summaries are non-critical
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [type, slug]);

  if (loading) return <Skeleton />;
  if (!summary) return null;

  return (
    <section className="py-8">
      <div className="max-w-5xl mx-auto px-4">
        <div className="rounded-xl border border-border/40 bg-surface/60 p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-amber-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 1l2.39 4.84L17.27 6.8l-3.64 3.55.86 5.01L10 13.08l-4.49 2.28.86-5.01L2.73 6.8l4.88-.96L10 1z" />
            </svg>
            <h2 className="text-lg font-semibold text-text">AI Summary</h2>
          </div>

          {/* Overview */}
          <p className="text-text-muted text-sm leading-relaxed">{summary.overview}</p>

          {/* Strengths */}
          {summary.strengths.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Strengths
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.strengths.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {summary.weaknesses.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Weaknesses
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary.weaknesses.map((w) => (
                  <span
                    key={w}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Positioning */}
          <div>
            <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
              Market Position
            </h3>
            <p className="text-sm text-text-muted">{summary.positioning}</p>
          </div>

          {/* Recommendation */}
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${getGradeColor(summary.recommendation)}`}
          >
            <span className="font-medium">Recommendation:</span>{" "}
            {summary.recommendation}
          </div>

          {/* Key Facts */}
          {summary.keyFacts.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">
                Key Facts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {summary.keyFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="rounded-lg border border-border/30 bg-surface/40 px-3 py-2"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-text-muted/60">
                      {fact.label}
                    </div>
                    <div className="text-sm font-medium text-text truncate">
                      {fact.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
