import { Container, Section } from "@aaas/ui";
import { StatsClient } from "./stats-client";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "System Analytics — AaaS Knowledge Index",
  description:
    "System-wide analytics for the AaaS Knowledge Index. Entity distribution, agent performance, submission pipeline, and content metrics.",
};

function StatsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-surface rounded-lg h-36" />
        ))}
      </div>
      <div className="animate-pulse bg-surface rounded-lg h-64" />
      <div className="animate-pulse bg-surface rounded-lg h-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="animate-pulse bg-surface rounded-lg h-56" />
        <div className="animate-pulse bg-surface rounded-lg h-56" />
      </div>
    </div>
  );
}

export default function StatsPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            System Analytics
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Real-time metrics across entities, agents, submissions, and content
            pipeline.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <Suspense fallback={<StatsLoadingSkeleton />}>
            <StatsClient />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
