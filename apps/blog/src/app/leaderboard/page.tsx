import { Container, Section, KineticBar, OrbitalOrb, OrbitalBackground } from "@aaas/ui";
import { getTrendingEntities } from "@/lib/entities";
import { LeaderboardClient } from "./leaderboard-client";
import { CollaborativeRecommendations } from "@/components/collaborative-recommendations";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Leaderboard — AaaS Knowledge Index",
  description:
    "Rankings of top AI tools, models, agents, skills, scripts, and benchmarks by composite score.",
};

export default async function LeaderboardPage() {
  const entities = await getTrendingEntities(100);

  return (
    <>
      <OrbitalBackground minimal planetScale={0.7} offset={{ x: 30, y: -10 }} />
      <Section className="relative pt-28 pb-8 hero-glow overflow-hidden">
        <div className="absolute top-16 right-[10%] hidden lg:block pointer-events-none">
          <OrbitalOrb size={44} color="circuit" followMouse />
        </div>
        <Container className="max-w-6xl relative z-10">
          <div className="section-topic"><span>Rankings</span></div>
          <h1 className="monolith-title text-4xl md:text-5xl lg:text-6xl mb-4">
            Leaderboard
          </h1>
          <p className="text-text-muted max-w-2xl">
            {entities.length} entities ranked by composite score across the AI ecosystem.
          </p>
          <span className="status-badge mt-4 inline-flex">Live Rankings — Auto-Updated</span>
        </Container>
      </Section>
      <KineticBar />
      <Section className="py-8">
        <Container className="max-w-6xl">
          <LeaderboardClient entities={entities} />
        </Container>
      </Section>
      <CollaborativeRecommendations />
    </>
  );
}
