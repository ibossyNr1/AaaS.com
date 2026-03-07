import { Card, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";
import Link from "next/link";

const accentBg: Record<string, string> = {
  blue: "bg-blue-subtle",
  purple: "bg-purple-subtle",
  green: "bg-green-subtle",
  pink: "bg-pink-subtle",
  gold: "bg-gold-subtle",
};

const accentDot: Record<string, string> = {
  blue: "bg-blue",
  purple: "bg-purple",
  green: "bg-green",
  pink: "bg-pink",
  gold: "bg-gold",
};

const accentText: Record<string, string> = {
  blue: "text-blue",
  purple: "text-purple",
  green: "text-green",
  pink: "text-pink",
  gold: "text-gold",
};

const pillars = [
  {
    accent: "blue" as const,
    title: "Context Engineering",
    description:
      "Turn strategy docs, brand guides, and domain knowledge into structured, machine-readable context. Your agents understand your business — not just generic prompts.",
    link: "/platform#context",
  },
  {
    accent: "purple" as const,
    title: "Connect Any Tool",
    description:
      "MCPs, APIs, GitHub, Slack, databases — agents use your full toolchain. No walled gardens, no vendor lock-in. Your stack, amplified.",
    link: "/platform#tools",
  },
  {
    accent: "green" as const,
    title: "Execute Autonomously",
    description:
      "Agents complete complex tasks end-to-end, learning from every cycle. From market research to outreach to compliance — they handle the work.",
    link: "/platform#execute",
  },
];

export function ThreePillars() {
  return (
    <Section>
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, i) => (
            <FadeUp key={pillar.title} delay={i * 0.1}>
              <Card accent={pillar.accent} className="h-full flex flex-col">
                <div
                  className={`w-10 h-10 rounded-lg mb-6 flex items-center justify-center ${accentBg[pillar.accent]}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${accentDot[pillar.accent]}`}
                  />
                </div>
                <h3 className="text-xl font-semibold text-text mb-3">
                  {pillar.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed flex-grow">
                  {pillar.description}
                </p>
                <Link
                  href={pillar.link}
                  className={`mt-6 text-sm font-medium ${accentText[pillar.accent]} hover:underline`}
                >
                  Learn more →
                </Link>
              </Card>
            </FadeUp>
          ))}
        </div>
      </Container>
    </Section>
  );
}
