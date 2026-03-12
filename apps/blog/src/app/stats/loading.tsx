import { Container, Section } from "@aaas/ui";

export default function StatsLoading() {
  return (
    <>
      <Section className="pt-28 pb-12">
        <Container className="max-w-5xl">
          <div className="animate-pulse bg-surface rounded h-12 w-64 mb-4" />
          <div className="animate-pulse bg-surface rounded h-5 w-96" />
        </Container>
      </Section>
      <Section className="pb-20">
        <Container className="max-w-5xl">
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-surface rounded-lg h-36"
                />
              ))}
            </div>
            <div className="animate-pulse bg-surface rounded-lg h-64" />
            <div className="animate-pulse bg-surface rounded-lg h-64" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="animate-pulse bg-surface rounded-lg h-56" />
              <div className="animate-pulse bg-surface rounded-lg h-56" />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
