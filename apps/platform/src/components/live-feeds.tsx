import { Container, Section, DeployFeed, TerminalFeed } from "@aaas/ui";
import { FadeUp } from "./motion";

export function LiveFeeds() {
  return (
    <Section variant="surface" divider>
      <Container>
        <FadeUp>
          <h2 className="monolith-title text-3xl md:text-4xl font-black text-center mb-4 uppercase tracking-tight">
            Live System Activity
          </h2>
          <p className="text-text-muted text-center mb-12 max-w-xl mx-auto">
            Real-time agent operations across the AaaS network.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FadeUp delay={0.1}>
            <DeployFeed maxItems={6} />
          </FadeUp>
          <FadeUp delay={0.2}>
            <TerminalFeed maxLines={8} />
          </FadeUp>
        </div>
      </Container>
    </Section>
  );
}
