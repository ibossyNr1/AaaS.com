import { Container, Section } from "@aaas/ui";
import { WebhooksClient } from "./webhooks-client";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhook Management — AaaS Knowledge Index",
  description:
    "Register, manage, and test webhooks to receive real-time notifications from the AaaS Knowledge Index.",
};

export default function WebhooksPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-4xl">
          <p className="text-xs font-mono uppercase tracking-wider text-circuit mb-3">
            Integrations
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Webhook Management
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Register webhooks to receive real-time HTTP notifications when
            events occur in the Knowledge Index. Manage subscriptions, test
            delivery, and review delivery history.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-4xl">
          <Suspense
            fallback={
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-surface rounded h-24"
                  />
                ))}
              </div>
            }
          >
            <WebhooksClient />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
