import { Container, Section } from "@aaas/ui";
import { WorkspaceDetailClient } from "./workspace-detail-client";
import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Workspace — AaaS Knowledge Index`,
    description: `View and manage workspace details, members, settings, and collections.`,
  };
}

export default function WorkspaceDetailPage({ params }: Props) {
  return (
    <>
      <Section className="pt-28 pb-0">
        <Container className="max-w-5xl">
          <WorkspaceDetailClient slug={params.slug} />
        </Container>
      </Section>

      <Section className="pb-20" />
    </>
  );
}
