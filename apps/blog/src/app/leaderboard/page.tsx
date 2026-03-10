import { Container, Section } from "@aaas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — AaaS Knowledge Index",
  description: "Rankings of top AI tools, models, agents, skills, and benchmarks.",
};

export default function LeaderboardPage() {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-5xl text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Leaderboard</h1>
        <p className="text-text-muted">Rankings coming in Phase 2. Scores are already being calculated.</p>
      </Container>
    </Section>
  );
}
