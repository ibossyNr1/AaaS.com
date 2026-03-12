import { Container, Section } from "@aaas/ui";

export default function ExploreLoading() {
  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <div className="animate-pulse bg-surface rounded h-10 w-72 mb-2" />
          <div className="animate-pulse bg-surface rounded h-4 w-96" />
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <div className="animate-pulse bg-surface rounded-lg h-10 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-surface rounded-lg h-48"
              />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
