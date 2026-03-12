import { Container, Section } from "@aaas/ui";
import { BookmarksClient } from "./bookmarks-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bookmarks — AaaS Knowledge Index",
  description: "Your bookmarked tools, models, agents, and more.",
};

export default function BookmarksPage() {
  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-5xl">
          <h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
            Your Bookmarks
          </h1>
          <p className="text-text-muted text-sm">
            Quick access to your saved entities across the knowledge index.
          </p>
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-5xl">
          <BookmarksClient />
        </Container>
      </Section>
    </>
  );
}
