import { Button, Container, Section } from "@aaas/ui";
import { AgentNetwork } from "./agent-network";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

export function Hero() {
  return (
    <Section className="relative pt-32 pb-24 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <Container className="relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-text leading-[1.1]">
              Your Autonomous{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue to-purple">
                Digital Workforce
              </span>
            </h1>
            <p className="mt-6 text-lg text-text-muted max-w-lg leading-relaxed">
              Context-engineered AI agents that adapt, learn, and scale your
              business operations. Turn strategy into structured intelligence
              that powers every decision.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={BOOKING_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg">Book a Call</Button>
              </a>
              <a href="/platform">
                <Button variant="secondary" size="lg">
                  Explore Platform →
                </Button>
              </a>
            </div>
          </div>

          {/* Right — Agent Network */}
          <div className="relative h-[400px] lg:h-[500px]">
            <AgentNetwork className="absolute inset-0 rounded-2xl" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
