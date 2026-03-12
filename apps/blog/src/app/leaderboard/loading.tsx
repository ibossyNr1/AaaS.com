import { Container, Section } from "@aaas/ui";

export default function LeaderboardLoading() {
  return (
    <>
      <Section className="pt-28 pb-8">
        <Container className="max-w-6xl">
          <div className="animate-pulse bg-surface rounded h-10 w-56 mb-2" />
          <div className="animate-pulse bg-surface rounded h-4 w-80" />
        </Container>
      </Section>
      <Section className="py-8">
        <Container className="max-w-6xl">
          <div className="space-y-3">
            <div className="animate-pulse bg-surface rounded-lg h-12 w-full" />
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-surface rounded-lg h-14"
              />
            ))}
          </div>
        </Container>
      </Section>
    </>
  );
}
