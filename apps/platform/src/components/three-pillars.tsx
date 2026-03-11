import { Card, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";
import Link from "next/link";

const pillars = [
  {
    number: "01",
    title: "Context Engineering",
    description:
      "Turn strategy docs, brand guides, and domain knowledge into structured, machine-readable context. Your agents understand your business — not just generic prompts.",
    link: "/platform#context",
    accent: "circuit" as const,
  },
  {
    number: "02",
    title: "Connect Any Tool",
    description:
      "MCPs, APIs, GitHub, Slack, databases — agents use your full toolchain. No walled gardens, no vendor lock-in. Your stack, amplified by autonomous intelligence.",
    link: "/platform#tools",
    accent: "red" as const,
  },
  {
    number: "03",
    title: "Execute Autonomously",
    description:
      "Agents complete complex tasks end-to-end, learning from every cycle. From market research to outreach to compliance — they handle the work while you focus on strategy.",
    link: "/platform#execute",
    accent: "circuit" as const,
  },
];

export function ThreePillars() {
  return (
    <Section divider>
      <Container>
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-4xl font-black text-center mb-4 uppercase tracking-tight">
            Three Pillars of Autonomy
          </h2>
          <p className="text-text-muted text-center mb-16 max-w-xl mx-auto">
            Every agent workforce stands on these foundations.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <FadeUp key={pillar.title} delay={i * 0.1}>
              <Card
                variant="glass"
                spotlight
                accentColor={pillar.accent}
                className="h-full flex flex-col"
              >
                <span className="font-mono text-[0.6rem] text-text-muted mb-4">
                  {pillar.number}
                </span>
                <h3 className="text-xl font-semibold text-text mb-3">
                  {pillar.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed flex-grow">
                  {pillar.description}
                </p>
                <Link
                  href={pillar.link}
                  className="mt-6 text-sm font-mono uppercase tracking-wider text-circuit hover:text-glow transition-all"
                >
                  Explore →
                </Link>
              </Card>
            </FadeUp>
          ))}
        </div>
      </Container>
    </Section>
  );
}
