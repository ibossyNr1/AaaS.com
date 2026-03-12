"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function ExploreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Search failed"
      suggestion="We couldn't load the explore page. Try your search again or return home."
    />
  );
}
