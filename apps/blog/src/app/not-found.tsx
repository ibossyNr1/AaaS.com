import Link from "next/link";
import { Container, Section, Button } from "@aaas/ui";

export default function NotFound() {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-xl text-center">
        <p className="text-8xl font-bold text-circuit mb-4 font-mono">404</p>
        <h1 className="text-2xl font-bold text-text mb-2">Page not found</h1>
        <p className="text-sm text-text-muted mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Try searching the Knowledge Index for what you need.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Go home</Button>
          </Link>
          <Link href="/explore">
            <Button variant="secondary">Explore entities</Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
