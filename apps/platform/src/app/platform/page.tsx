"use client";

import { useState } from "react";
import { Button, Card, Badge, Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const accentStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  blue: { bg: "bg-blue-subtle", text: "text-blue", border: "border-blue/30", dot: "bg-blue" },
  purple: { bg: "bg-purple-subtle", text: "text-purple", border: "border-purple/30", dot: "bg-purple" },
  green: { bg: "bg-green-subtle", text: "text-green", border: "border-green/30", dot: "bg-green" },
  pink: { bg: "bg-pink-subtle", text: "text-pink", border: "border-pink/30", dot: "bg-pink" },
  gold: { bg: "bg-gold-subtle", text: "text-gold", border: "border-gold/30", dot: "bg-gold" },
};

const evolutionSteps = [
  {
    title: "Scout",
    accent: "blue",
    description:
      "Agents continuously scan markets, competitors, and opportunities using your strategic context as a filter.",
  },
  {
    title: "Evaluate",
    accent: "purple",
    description:
      "Findings are analyzed against your business goals, risk tolerance, and competitive positioning.",
  },
  {
    title: "Integrate",
    accent: "green",
    description:
      "Validated insights are woven into your context layer, making every future agent action smarter.",
  },
  {
    title: "Optimize",
    accent: "gold",
    description:
      "Agents refine their own workflows based on outcomes, continuously improving execution quality.",
  },
];

const capabilities = [
  {
    title: "Research",
    accent: "blue" as const,
    description:
      "Market analysis, competitor tracking, trend identification, and deep-dive reports — all contextualized to your industry.",
  },
  {
    title: "Marketing",
    accent: "purple" as const,
    description:
      "Content creation, campaign strategy, social media management, and brand voice consistency at scale.",
  },
  {
    title: "Analytics",
    accent: "green" as const,
    description:
      "Data synthesis, performance dashboards, insight extraction, and predictive modeling from your business data.",
  },
  {
    title: "Sales",
    accent: "gold" as const,
    description:
      "Lead research, outreach sequences, proposal generation, and CRM management — personalized to each prospect.",
  },
  {
    title: "Operations",
    accent: "pink" as const,
    description:
      "Workflow automation, compliance monitoring, process documentation, and operational intelligence.",
  },
  {
    title: "Development",
    accent: "blue" as const,
    description:
      "Code generation, architecture planning, documentation, testing, and DevOps automation.",
  },
];

export default function PlatformPage() {
  const [activeEvolution, setActiveEvolution] = useState(0);

  return (
    <>
      {/* Hero */}
      <Section className="pt-32 pb-12">
        <Container className="text-center">
          <FadeUp>
            <Badge color="blue" className="mb-4">
              The Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-text mb-4">
              Context-First{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue to-purple">
                Agent Architecture
              </span>
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Every agent runs on your structured business context. No generic
              prompts. No hallucinated strategy. Real understanding, real
              execution.
            </p>
          </FadeUp>
        </Container>
      </Section>

      {/* Evolution Loop */}
      <Section id="how-it-works" variant="surface">
        <Container>
          <FadeUp>
            <h2 className="text-3xl md:text-4xl font-bold text-text text-center mb-16">
              The Evolution Loop
            </h2>
          </FadeUp>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {evolutionSteps.map((step, i) => (
              <button
                key={step.title}
                onClick={() => setActiveEvolution(i)}
                className={cn(
                  "px-6 py-3 rounded-xl text-sm font-medium transition-all border",
                  i === activeEvolution
                    ? `${accentStyles[step.accent].bg} ${accentStyles[step.accent].text} ${accentStyles[step.accent].border}`
                    : "bg-surface text-text-muted border-border hover:text-text"
                )}
              >
                {step.title}
              </button>
            ))}
          </div>

          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-semibold text-text mb-4">
              {evolutionSteps[activeEvolution].title}
            </h3>
            <p className="text-text-muted leading-relaxed">
              {evolutionSteps[activeEvolution].description}
            </p>
          </div>
        </Container>
      </Section>

      {/* Capability Grid */}
      <Section>
        <Container>
          <FadeUp>
            <h2 className="text-3xl md:text-4xl font-bold text-text text-center mb-4">
              What Agents Can Do
            </h2>
            <p className="text-text-muted text-center mb-16 max-w-xl mx-auto">
              Six capability domains, infinite applications — all powered by
              your business context.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((cap, i) => (
              <FadeUp key={cap.title} delay={i * 0.08}>
                <Card accent={cap.accent} className="h-full">
                  <div
                    className={`w-10 h-10 rounded-lg mb-4 flex items-center justify-center ${accentStyles[cap.accent].bg}`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${accentStyles[cap.accent].dot}`}
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-text mb-2">
                    {cap.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {cap.description}
                  </p>
                </Card>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* Adaptability */}
      <Section variant="surface">
        <Container className="text-center">
          <FadeUp>
            <h2 className="text-3xl md:text-4xl font-bold text-text mb-6">
              Agents That Grow With You
            </h2>
            <p className="text-text-muted max-w-2xl mx-auto mb-8 leading-relaxed">
              As your business evolves, your agents evolve too. New products,
              new markets, new strategies — the context layer adapts, and
              agents immediately reflect the change.
            </p>
            <a
              href={BOOKING_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg">See It In Action</Button>
            </a>
          </FadeUp>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
