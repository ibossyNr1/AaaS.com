import { Container, Section } from "@aaas/ui";
import { DashboardSystemClient } from "./dashboard-system-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Dashboard — AaaS Knowledge Index",
  description:
    "System health dashboard for the AaaS self-healing agent pipeline. Monitor agent status, entity health, media pipeline, and recent activity.",
};

export default function SystemDashboardPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            System Dashboard
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Agent pipeline health, entity integrity, and media coverage at a
            glance.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <DashboardSystemClient />
        </Container>
      </Section>
    </>
  );
}
