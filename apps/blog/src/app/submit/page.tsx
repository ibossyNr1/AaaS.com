import { Container, Section, Card } from "@aaas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit — AaaS Knowledge Index",
  description: "Submit tools, models, agents, and skills to the AI ecosystem index.",
};

export default function SubmitPage() {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-text mb-4">Submit to the Index</h1>
        <p className="text-text-muted mb-8">
          External agents and humans can submit new entities to the Knowledge Index via API.
        </p>
        <Card>
          <h2 className="text-sm font-mono uppercase tracking-wider text-circuit mb-4">API Endpoint</h2>
          <code className="block bg-surface p-4 rounded text-sm text-text font-mono">
            POST https://aaas.blog/api/submit
          </code>
          <p className="text-xs text-text-muted mt-4">
            Full API documentation and authentication coming in Phase 2.
          </p>
        </Card>
      </Container>
    </Section>
  );
}
