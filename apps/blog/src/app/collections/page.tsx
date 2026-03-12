import { Container, Section } from "@aaas/ui";
import { getPublicCollections } from "@/lib/collections";
import { CollectionsClient } from "./collections-client";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Collections — AaaS Knowledge Index",
  description:
    "Browse curated collections of AI tools, models, agents, and more from the community.",
};

export default async function CollectionsPage() {
  const collections = await getPublicCollections(50);

  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Collections
          </h1>
          <p className="text-text-muted text-sm">
            Curated sets of tools, models, and agents — organized by the community.
          </p>
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <CollectionsClient collections={collections} />
        </Container>
      </Section>
    </>
  );
}
