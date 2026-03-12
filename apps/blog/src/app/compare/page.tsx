import { Suspense } from "react";
import { Container, Section } from "@aaas/ui";
import type { Metadata } from "next";
import { CompareClient } from "./compare-client";
import { getTrendingEntities } from "@/lib/entities";

export const metadata: Metadata = {
  title: "Compare — AaaS Knowledge Index",
  description: "Compare AI tools, models, and agents side by side.",
};

export default async function ComparePage() {
  const allEntities = await getTrendingEntities(200);
  return (
    <Section className="pt-28 pb-20">
      <Container className="max-w-6xl">
        <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">Compare</p>
        <h1 className="text-3xl font-bold text-text mb-2">Side-by-Side Comparison</h1>
        <p className="text-text-muted mb-8">Select two entities to compare their scores, capabilities, and metadata.</p>
        <Suspense fallback={<div className="text-text-muted text-sm py-12 text-center">Loading comparison...</div>}>
          <CompareClient entities={allEntities} />
        </Suspense>
      </Container>
    </Section>
  );
}
