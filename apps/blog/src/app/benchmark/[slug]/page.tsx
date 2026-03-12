import { EntityPage } from "@/components/entity-page";
import { getAllSlugs, getEntity } from "@/lib/entities";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllSlugs("benchmark");
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const entity = await getEntity("benchmark", params.slug);
  if (!entity) return {};
  return {
    title: `${entity.name} — AaaS Knowledge Index`,
    description: entity.description,
    openGraph: {
      title: entity.name,
      description: entity.description,
      url: `https://aaas.blog/benchmark/${entity.slug}`,
      images: [`/og?title=${encodeURIComponent(entity.name)}&type=benchmark&provider=${encodeURIComponent(entity.provider)}&score=${entity.scores.composite}`],
    },
  };
}

export default function BenchmarkPage({ params }: { params: { slug: string } }) {
  return <EntityPage type="benchmark" slug={params.slug} />;
}
