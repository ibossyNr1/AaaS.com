import { Container, Section } from "@aaas/ui";
import { EntitiesClient } from "./entities-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entity Management — AaaS Admin",
  description:
    "Manage all entities in the AaaS Knowledge Index. Filter, sort, edit, and perform bulk actions.",
};

export default function AdminEntitiesPage() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-7xl">
          <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
            Entity Management
          </h1>
          <p className="text-lg text-text-muted leading-relaxed max-w-3xl">
            Browse, filter, and manage all entities in the knowledge index.
          </p>
        </Container>
      </Section>

      <Section className="pb-20">
        <Container className="max-w-7xl">
          <EntitiesClient />
        </Container>
      </Section>
    </>
  );
}
