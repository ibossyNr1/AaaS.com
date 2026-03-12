import { EntityPage } from "@/components/entity-page";
import { getAllSlugs, getEntity } from "@/lib/entities";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const slugs = await getAllSlugs("model");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const entity = await getEntity("model", params.slug);
  if (!entity) return {};
  return {
    title: `${entity.name} — AaaS Knowledge Index`,
    description: entity.description,
    openGraph: {
      title: entity.name,
      description: entity.description,
      url: `https://aaas.blog/model/${entity.slug}`,
      images: [`/og?title=${encodeURIComponent(entity.name)}&type=model&provider=${encodeURIComponent(entity.provider)}&score=${entity.scores.composite}`],
    },
  };
}

export default function ModelPage({ params }: { params: { slug: string } }) {
  return <EntityPage type="model" slug={params.slug} />;
}
