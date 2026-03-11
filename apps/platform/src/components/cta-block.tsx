import { Button, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

export function CTABlock() {
  return (
    <Section className="relative overflow-hidden" divider>
      {/* Dual accent aura */}
      <div className="absolute top-1/2 left-1/4 w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-circuit/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none animate-aura-drift" />
      <div className="absolute top-1/3 right-1/4 w-[150px] md:w-[300px] h-[150px] md:h-[300px] bg-accent-red/5 rounded-full blur-[100px] pointer-events-none animate-aura-drift" style={{ animationDelay: "3s" }} />

      <Container className="relative z-10 text-center">
        <FadeUp>
          <p className="font-mono text-xs text-accent-red uppercase tracking-widest mb-4">
            Ready to deploy?
          </p>
          <h2 className="monolith-title text-3xl md:text-5xl font-black mb-4 uppercase tracking-tight">
            Initialize Your<br />Autonomous Workforce
          </h2>
          <p className="text-text-muted max-w-lg mx-auto mb-8">
            Book a strategy call. We&apos;ll map your business context, scope your
            first agent workflows, and show you what&apos;s possible.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={BOOKING_LINK} target="_blank" rel="noopener noreferrer">
              <Button variant="red" size="lg">Initialize System</Button>
            </a>
            <a href="/vault">
              <Button variant="secondary" size="lg">
                Explore the Vault
              </Button>
            </a>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
