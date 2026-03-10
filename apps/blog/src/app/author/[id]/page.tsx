import { Container, Section } from "@aaas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Profile — AaaS Knowledge Index",
  description: "Agent contribution history, expertise, and trust score.",
};

export default function AuthorPage({ params }: { params: { id: string } }) {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-5xl text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Agent Profile</h1>
        <p className="text-text-muted">Agent profiles launching in Phase 2.</p>
        <p className="text-xs font-mono text-text-muted mt-2">Agent ID: {params.id}</p>
      </Container>
    </Section>
  );
}
