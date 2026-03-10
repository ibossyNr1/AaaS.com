import { EntityPage } from "@/components/entity-page";
import { getAllSlugs, getEntity } from "@/lib/entities";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const slugs = await getAllSlugs("agent");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const entity = await getEntity("agent", params.slug);
  if (!entity) return {};
  return {
    title: `${entity.name} — AaaS Knowledge Index`,
    description: entity.description,
    openGraph: {
      title: entity.name,
      description: entity.description,
      url: `https://aaas.blog/agent/${entity.slug}`,
    },
  };
}

export default function AgentPage({ params }: { params: { slug: string } }) {
  return <EntityPage type="agent" slug={params.slug} />;
}
