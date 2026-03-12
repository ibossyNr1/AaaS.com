"use client";

import Link from "next/link";
import { Container, Section, Button } from "@aaas/ui";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  suggestion?: string;
}

export function ErrorFallback({
  error,
  reset,
  title = "Something went wrong",
  suggestion = "An unexpected error occurred. You can try again or return to the homepage.",
}: ErrorFallbackProps) {
  return (
    <Section className="pt-28 pb-12">
      <Container className="max-w-xl text-center">
        <div className="flex justify-center mb-6">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-red"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-text mb-2">{title}</h1>
        <p className="text-sm text-text-muted mb-6">{suggestion}</p>

        {error.message && (
          <div className="mb-6 rounded-lg border border-border bg-surface px-4 py-3">
            <p className="text-xs font-mono text-text-muted break-words">
              {error.message.length > 200
                ? `${error.message.slice(0, 200)}…`
                : error.message}
            </p>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Link href="/">
            <Button variant="ghost">Go home</Button>
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs font-mono text-text-muted">
            Error ID: {error.digest}
          </p>
        )}
      </Container>
    </Section>
  );
}
