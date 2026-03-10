import type { Metadata } from "next";
import { Button, Card, Badge, Container, Section } from "@aaas/ui";
import { FadeUp } from "@/components/motion";
import { CTABlock } from "@/components/cta-block";

export const metadata: Metadata = {
  title: "Collaborate | Agent-as-a-Service",
  description: "Invest in or co-innovate with AaaS. Two paths to partnership.",
  openGraph: { title: "Collaborate with AaaS", description: "Build the Future With Us" },
};

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

const equitySteps = [
  {
    number: "01",
    title: "Discover",
    description:
      "We evaluate your venture's potential, market opportunity, and how autonomous agents can accelerate your trajectory. This includes a deep-dive into your domain, competitive landscape, and technology requirements.",
    icon: "⟐",
  },
  {
    number: "02",
    title: "Deploy",
    description:
      "Full AaaS platform deployment with custom context engineering, agent workflows, and tool integrations tailored to your business. Your entire operational stack, powered by autonomous intelligence.",
    icon: "◈",
  },
  {
    number: "03",
    title: "Grow",
    description:
      "Ongoing strategic support, agent optimization, and infrastructure scaling as your venture grows. We succeed when you succeed — that's the beauty of equity alignment.",
    icon: "◉",
  },
];

const ambassadorBenefits = [
  {
    title: "Co-Branded Instance",
    description: "Get a white-labeled AaaS platform with your branding. \"The [Your Name] Agent Suite\" — powered by AaaS infrastructure.",
  },
  {
    title: "Revenue Share",
    description: "Drive traffic, we provide the infrastructure. Transparent revenue split on every user you bring to the platform.",
  },
  {
    title: "Custom Workflows",
    description: "We build your specific workflows into the platform. Your unique methodology, automated and scalable.",
  },
  {
    title: "Early Access",
    description: "First to test new features, new models, new capabilities. Your feedback shapes the product roadmap.",
  },
];

const ventureStats = [
  { value: "5-15%", label: "Typical Equity Range" },
  { value: "Full", label: "Platform Access" },
  { value: "Custom", label: "Agent Development" },
  { value: "Ongoing", label: "Strategic Advisory" },
];

export default function CollaboratePage() {
  return (
    <>
      {/* Hero — Aura */}
      <Section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-1/3 w-48 md:w-96 h-48 md:h-96 rounded-full bg-accent-red/5 blur-3xl animate-aura-drift" />
          <div className="absolute bottom-0 left-1/4 w-40 md:w-80 h-40 md:h-80 rounded-full bg-circuit/6 blur-3xl animate-aura-drift" style={{ animationDelay: "3s" }} />
        </div>

        <Container className="relative z-10 text-center">
          <FadeUp>
            <Badge variant="red" className="mb-4">Collaborate</Badge>
            <h1 className="monolith-title text-4xl md:text-6xl font-bold mb-4 uppercase tracking-tight">
              Build the Future<br />With Us
            </h1>
            <p className="text-lg text-text-muted max-w-2xl mx-auto">
              Three paths to partnership. Whether you&apos;re investing in AI
              infrastructure, building a venture that needs it, or have an
              audience that wants it — we&apos;re looking for aligned partners.
            </p>
          </FadeUp>
        </Container>
      </Section>

      {/* Two Cards — Bedrock */}
      <Section className="py-12" divider="red">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FadeUp>
              <Card variant="bedrock" spotlight className="h-full flex flex-col">
                <Badge className="mb-4 self-start">For Investors</Badge>
                <h2 className="text-2xl font-bold text-text mb-2">Invest in AaaS</h2>
                <p className="font-mono text-xs text-circuit/50 uppercase tracking-wider mb-4">
                  Pre-seed — Revenue generating — Growing pipeline
                </p>
                <p className="text-text-muted leading-relaxed mb-6 flex-grow">
                  AaaS is building the operating system for autonomous business
                  operations. The agentic service domain is exploding, and we&apos;re
                  positioned at the intersection of context engineering, multi-model
                  orchestration, and autonomous execution. We&apos;re seeking strategic
                  investors who understand that the future of work is agentic.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Pre-seed stage with live, revenue-generating product",
                    "Unique context engineering moat — 847K+ vectors",
                    "LLM-agnostic architecture via Open Router",
                    "Growing enterprise pipeline & ambassador network",
                    "Equity-for-service venture builder model",
                    "Manufacturing vertical (Enora.ai) as proof of concept",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-muted"
                    >
                      <span className="text-circuit mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={BOOKING_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="w-full">Investor Conversation</Button>
                </a>
              </Card>
            </FadeUp>

            <FadeUp delay={0.1}>
              <Card variant="bedrock" spotlight accentColor="red" className="h-full flex flex-col">
                <Badge variant="red" className="mb-4 self-start">For Ventures</Badge>
                <h2 className="text-2xl font-bold text-text mb-2">Co-Innovate</h2>
                <p className="font-mono text-xs text-accent-red/50 uppercase tracking-wider mb-4">
                  Equity-for-service — Full deployment — Shared upside
                </p>
                <p className="text-text-muted leading-relaxed mb-6 flex-grow">
                  Have a venture that could be supercharged with autonomous
                  agents? We deploy our full platform in exchange for equity
                  alignment. Your domain expertise + our AI infrastructure =
                  a venture that moves at machine speed. We&apos;ve done it with
                  Enora.ai in manufacturing, and we&apos;re ready to do it in your vertical.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Full AaaS platform deployment & custom context",
                    "Dedicated agent development for your use cases",
                    "Minority equity stake (typically 5-15%)",
                    "Strategic advisory & go-to-market support",
                    "Access to Superforge venture network",
                    "Priority feature development & model access",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-text-muted"
                    >
                      <span className="text-accent-red mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <a
                  href={BOOKING_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="red" className="w-full">
                    Explore Partnership
                  </Button>
                </a>
              </Card>
            </FadeUp>
          </div>
        </Container>
      </Section>

      {/* Venture Stats */}
      <Section variant="surface" className="py-12">
        <Container>
          <FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {ventureStats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold font-mono text-circuit">{s.value}</div>
                  <div className="font-mono text-xs uppercase tracking-wider text-text-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </Container>
      </Section>

      {/* Equity Model Timeline */}
      <Section divider>
        <Container>
          <FadeUp>
            <div className="text-center mb-16">
              <Badge className="mb-4">The Process</Badge>
              <h2 className="monolith-title text-3xl md:text-4xl font-bold uppercase tracking-tight">
                The Equity Model
              </h2>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {equitySteps.map((step, i) => (
              <FadeUp key={step.number} delay={i * 0.12}>
                <div className="text-center">
                  <div className="w-20 h-20 glass rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <span className="text-circuit font-mono font-bold text-xl">
                      {step.icon}
                    </span>
                    <div className="absolute inset-0 rounded-full border border-circuit/10 animate-orb-pulse" />
                  </div>
                  <span className="font-mono text-xs text-text-muted">{step.number}</span>
                  <h3 className="text-xl font-semibold text-text mb-3 mt-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-text-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </Container>
      </Section>

      {/* Ambassador Program */}
      <Section variant="bedrock" divider="red">
        <Container>
          <FadeUp>
            <div className="text-center mb-12">
              <Badge variant="red" className="mb-4">For Creators</Badge>
              <h2 className="monolith-title text-3xl md:text-4xl font-bold mb-4 uppercase tracking-tight">
                Ambassador Program
              </h2>
              <p className="text-text-muted max-w-2xl mx-auto">
                Are you a YouTuber, LinkedIn creator, or AI influencer with an engaged
                audience? We&apos;ll build your specific workflows into the platform and give
                you a co-branded instance. Your methodology, automated and scalable.
              </p>
            </div>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ambassadorBenefits.map((benefit, i) => (
              <FadeUp key={benefit.title} delay={i * 0.08}>
                <Card variant="glass" accentColor="red" className="h-full">
                  <h3 className="font-semibold text-text mb-2">{benefit.title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{benefit.description}</p>
                </Card>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={0.4}>
            <div className="text-center mt-12">
              <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
                <Button variant="red" size="lg">Become an Ambassador</Button>
              </a>
            </div>
          </FadeUp>
        </Container>
      </Section>

      <CTABlock />
    </>
  );
}
