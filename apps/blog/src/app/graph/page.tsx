import { Suspense } from "react";
import { Container, Section } from "@aaas/ui";
import type { Metadata } from "next";
import { GraphClient } from "./graph-client";
import { getTrendingEntities } from "@/lib/entities";

export const metadata: Metadata = {
  title: "Entity Graph — AaaS Knowledge Index",
  description: "Visual relationship graph of AI tools, models, agents, and skills.",
};

export default async function GraphPage() {
  const allEntities = await getTrendingEntities(200);
  return (
    <Section className="pt-28 pb-20">
      <Container className="max-w-7xl">
        <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">Graph</p>
        <h1 className="text-3xl font-bold text-text mb-2">Entity Relationship Graph</h1>
        <p className="text-text-muted mb-8">Explore how AI tools, models, agents, and skills connect to each other.</p>
        <Suspense fallback={<div className="text-text-muted text-sm py-12 text-center">Loading graph...</div>}>
          <GraphClient entities={allEntities} />
        </Suspense>
      </Container>
    </Section>
  );
}
