"use client";

import { useState } from "react";
import { Button, Card, Container, Section, cn } from "@aaas/ui";
import { FadeUp } from "./motion";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const cases = [
  {
    label: "Startups",
    headline: "Replace 5 SaaS tools with one agentic workforce.",
    body: "From market research to outreach to financial modeling — agents handle it. Get the operational capacity of a 10-person team without the headcount. Your context layer grows with your company, so agents scale as you do.",
    stats: { agents: "8-12", tasks: "500+/mo", savings: "70%" },
  },
  {
    label: "SMBs",
    headline: "Scale operations without scaling costs.",
    body: "Automate repetitive workflows, generate reports, manage compliance, and execute marketing campaigns — all contextualized to your business. No more context-switching between tools. One workforce, infinite applications.",
    stats: { agents: "6-10", tasks: "300+/mo", savings: "60%" },
  },
  {
    label: "Consultants",
    headline: "Deliver 10x more value to every client.",
    body: "Deploy agent workflows for each client engagement. Research, analysis, and deliverable generation — done in hours, not weeks. Each client gets their own context layer, their own agent team, their own results.",
    stats: { agents: "4-8", tasks: "200+/mo", savings: "80%" },
  },
  {
    label: "Corporate",
    headline: "Prototype and validate at startup speed.",
    body: "Innovation departments use AaaS to rapidly test new initiatives with dedicated agent teams. From concept to proof-of-concept in days, not months. Run parallel experiments without parallel budgets.",
    stats: { agents: "12-20", tasks: "1000+/mo", savings: "55%" },
  },
  {
    label: "Education",
    headline: "Teach entrepreneurship with real AI infrastructure.",
    body: "Students build and run ventures on AaaS. Real agents, real tools, real market execution — the ultimate learning-by-doing platform. Prepare the next generation for the agentic economy.",
    stats: { agents: "3-6", tasks: "100+/mo", savings: "90%" },
  },
];

export function UseCases() {
  const [active, setActive] = useState(0);
  const current = cases[active]!;

  return (
    <Section divider>
      <Container>
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-4xl font-black text-center mb-4 uppercase tracking-tight">
            Built For Your World
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-xl mx-auto">
            Every industry, every scale — agents adapt to your context.
          </p>
        </FadeUp>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {cases.map((c, i) => (
            <button
              key={c.label}
              onClick={() => setActive(i)}
              className={cn(
                "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-all duration-500 ease-liquid border rounded-sm",
                i === active
                  ? "border-accent-red text-accent-red bg-accent-red/5 shadow-[0_0_15px_var(--accent-red-dim)]"
                  : "border-border text-text-muted hover:text-text hover:border-text/20"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Content + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-semibold text-text mb-4">
              {current.headline}
            </h3>
            <p className="text-text-muted leading-relaxed mb-8">
              {current.body}
            </p>
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="red">Book a Call</Button>
            </a>
          </div>

          {/* Stats panel */}
          <Card variant="glass" className="flex flex-col justify-center">
            <div className="space-y-6">
              <div>
                <div className="font-mono text-[0.6rem] text-text-muted uppercase tracking-wider mb-1">
                  Typical Agent Count
                </div>
                <div className="text-2xl font-bold font-mono text-circuit">
                  {current.stats.agents}
                </div>
              </div>
              <div>
                <div className="font-mono text-[0.6rem] text-text-muted uppercase tracking-wider mb-1">
                  Monthly Tasks
                </div>
                <div className="text-2xl font-bold font-mono text-accent-red">
                  {current.stats.tasks}
                </div>
              </div>
              <div>
                <div className="font-mono text-[0.6rem] text-text-muted uppercase tracking-wider mb-1">
                  Cost Reduction
                </div>
                <div className="text-2xl font-bold font-mono text-accent-teal">
                  {current.stats.savings}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </Section>
  );
}
