export const dynamic = "force-dynamic";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

const typeToCollection: Record<string, string> = {
  tool: "tools",
  model: "models",
  agent: "agents",
  skill: "skills",
  script: "scripts",
  benchmark: "benchmarks",
};

const validMetrics = [
  "composite",
  "adoption",
  "quality",
  "freshness",
  "citations",
  "engagement",
] as const;

type Metric = (typeof validMetrics)[number];

function getColor(score: number): string {
  if (score >= 70) return "#4c1";
  if (score >= 40) return "#dfb317";
  return "#e05d44";
}

function generateBadge(label: string, value: string, color: string): string {
  const labelWidth = label.length * 6.5 + 10;
  const valueWidth = value.length * 6.5 + 10;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r"><rect width="${totalWidth}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

function svgResponse(svg: string): NextResponse {
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string; slug: string }> }
) {
  const { type, slug } = await params;

  const collection = typeToCollection[type];
  if (!collection) {
    return svgResponse(generateBadge("aaas", "invalid type", "#e05d44"));
  }

  const metric = (request.nextUrl.searchParams.get("metric") ||
    "composite") as string;
  if (!validMetrics.includes(metric as Metric)) {
    return svgResponse(generateBadge("aaas", "invalid metric", "#e05d44"));
  }

  try {
    const docRef = doc(db, collection, slug);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return svgResponse(generateBadge("aaas", "not found", "#e05d44"));
    }

    const data = snapshot.data();
    const scores = data?.scores;

    if (!scores || typeof scores[metric] !== "number") {
      return svgResponse(generateBadge("aaas", "no data", "#9f9f9f"));
    }

    const score = Math.round(scores[metric] as number);
    const color = getColor(score);
    const value = `${score} ${metric}`;

    return svgResponse(generateBadge("aaas", value, color));
  } catch {
    return svgResponse(generateBadge("aaas", "error", "#e05d44"));
  }
}
