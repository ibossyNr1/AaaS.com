import { Button, Container, Section } from "@aaas/ui";
import { FadeUp } from "./motion";

const BOOKING_LINK = "https://calendar.app.google/X2MjiFt1vkksn2ga8";

export function CTABlock() {
  return (
    <Section className="relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-blue/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[300px] h-[300px] bg-purple/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />

      <Container className="relative z-10 text-center">
        <FadeUp>
          <h2 className="text-3xl md:text-5xl font-bold text-text mb-6">
            Ready to build your autonomous workforce?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={BOOKING_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg">Book a Call</Button>
            </a>
            <a href="/vault">
              <Button variant="secondary" size="lg">
                Explore the Vault →
              </Button>
            </a>
          </div>
        </FadeUp>
      </Container>
    </Section>
  );
}
