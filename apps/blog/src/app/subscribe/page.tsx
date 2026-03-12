import { Container, Section } from "@aaas/ui";
import { SubscribeForm } from "./subscribe-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscribe — AaaS Knowledge Index",
  description:
    "Get a weekly digest of AI ecosystem trends, new entities, and agent health reports from the AaaS Knowledge Index.",
};

export default function SubscribePage() {
  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2 text-center">
            Weekly Digest
          </h1>
          <p className="text-text-muted text-sm text-center max-w-lg mx-auto">
            Subscribe to receive a curated summary of trending entities, new additions,
            and the health of the self-healing agent system — delivered every week.
          </p>
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <SubscribeForm />
        </Container>
      </Section>
    </>
  );
}
