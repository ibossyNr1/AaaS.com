import { Container, Section } from "@aaas/ui";
import { EventsClient } from "./events-client";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Event Stream — AaaS Knowledge Index",
  description:
    "Real-time event stream showing entity changes, score updates, submissions, and trending alerts across the AaaS Knowledge Index.",
};

export default function EventsPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
            Real-Time
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Event Stream
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Live feed of everything happening across the Knowledge Index —
            entity changes, score updates, submissions, and trending alerts.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <Suspense
            fallback={
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-surface rounded h-16"
                  />
                ))}
              </div>
            }
          >
            <EventsClient />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
