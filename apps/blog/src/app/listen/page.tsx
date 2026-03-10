import { Container, Section } from "@aaas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listen — AaaS Knowledge Index",
  description: "Audio narrations, daily digests, and interactive podcasts from the AI ecosystem.",
};

export default function ListenPage() {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-5xl text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Audio Hub</h1>
        <p className="text-text-muted">Podcasts and audio narrations launching in Phase 3.</p>
        <a href="https://agents-as-a-service.com/vault" target="_blank" rel="noopener noreferrer"
          className="text-sm text-circuit hover:underline font-mono mt-4 inline-block">
          Subscribe via Vault to get notified →
        </a>
      </Container>
    </Section>
  );
}
