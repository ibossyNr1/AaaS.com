import { EntityPage } from "@/components/entity-page";
import { getAllSlugs, getEntity } from "@/lib/entities";
import type { Metadata } from "next";

export async function generateStaticParams() {
  const slugs = await getAllSlugs("script");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const entity = await getEntity("script", params.slug);
  if (!entity) return {};
  return {
    title: `${entity.name} — AaaS Knowledge Index`,
    description: entity.description,
    openGraph: {
      title: entity.name,
      description: entity.description,
      url: `https://aaas.blog/script/${entity.slug}`,
      images: [`/og?title=${encodeURIComponent(entity.name)}&type=script&provider=${encodeURIComponent(entity.provider)}&score=${entity.scores.composite}`],
    },
  };
}

export default function ScriptPage({ params }: { params: { slug: string } }) {
  return <EntityPage type="script" slug={params.slug} />;
}
