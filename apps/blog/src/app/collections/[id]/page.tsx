import { Container, Section } from "@aaas/ui";
import { getCollection } from "@/lib/collections";
import { CollectionDetailClient } from "./collection-detail-client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 60;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const col = await getCollection(params.id);
  if (!col) return { title: "Collection Not Found" };
  return {
    title: `${col.name} — AaaS Collections`,
    description: col.description || `A curated collection of ${col.entities?.length || 0} entities.`,
  };
}

export default async function CollectionPage({ params }: Props) {
  const col = await getCollection(params.id);
  if (!col) notFound();

  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-5xl">
          <CollectionDetailClient collection={col} />
        </Container>
      </Section>
    </>
  );
}
