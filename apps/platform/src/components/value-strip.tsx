import { Badge, Container, Section, DataTape } from "@aaas/ui";
import { FadeUp } from "./motion";

const tapeItems = [
  "CONTEXT ENGINE v2.4",
  "LLM AGNOSTIC",
  "MCP NATIVE",
  "SKILL REPOSITORY: 4,200+",
  "UPTIME: 99.9999992%",
  "AGENTS DEPLOYED: 142+",
  "OPEN ROUTER INTEGRATED",
  "ISO 9001 COMPLIANT",
  "CONTEXT VECTORS: 847K",
  "ZERO VENDOR LOCK-IN",
];

export function ValueStrip() {
  return (
    <>
      <DataTape items={tapeItems} speed="slow" />
      <Section variant="surface">
        <Container className="text-center">
          <FadeUp>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <Badge>Context Engineering</Badge>
              <Badge variant="red">Tool Connectivity</Badge>
              <Badge>Agentic Work</Badge>
            </div>
            <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
              AaaS transforms your business strategy into structured context that
              powers a continuously evolving network of AI agents — so they
              actually understand your business. No generic prompts. No
              hallucinated strategy. Real understanding, real execution.
            </p>
          </FadeUp>
        </Container>
      </Section>
    </>
  );
}
