import { Container, Section } from "@aaas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — AaaS Knowledge Index",
  description: "Your personalized AI ecosystem dashboard.",
};

export default function DashboardPage() {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-5xl text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Dashboard</h1>
        <p className="text-text-muted">Personalized dashboard launching in Phase 2.</p>
      </Container>
    </Section>
  );
}
