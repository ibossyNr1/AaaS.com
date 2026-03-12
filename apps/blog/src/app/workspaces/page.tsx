import { Container, Section } from "@aaas/ui";
import { WorkspacesClient } from "./workspaces-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspaces — AaaS Knowledge Index",
  description:
    "Create and manage multi-tenant workspaces. Collaborate with your team on curated AI entity collections, digests, and research.",
};

export default function WorkspacesPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Workspaces
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Create shared workspaces for your team. Curate entity collections,
            manage members, and collaborate on AI research.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-5xl">
          <WorkspacesClient />
        </Container>
      </Section>
    </>
  );
}
