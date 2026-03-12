import { EntityPage } from "@/components/entity-page";
import { getAllSlugs, getEntity } from "@/lib/entities";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllSlugs("tool");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const entity = await getEntity("tool", params.slug);
  if (!entity) return {};
  return {
    title: `${entity.name} — AaaS Knowledge Index`,
    description: entity.description,
    openGraph: {
      title: entity.name,
      description: entity.description,
      url: `https://aaas.blog/tool/${entity.slug}`,
      images: [`/og?title=${encodeURIComponent(entity.name)}&type=tool&provider=${encodeURIComponent(entity.provider)}&score=${entity.scores.composite}`],
    },
  };
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  return <EntityPage type="tool" slug={params.slug} />;
}
