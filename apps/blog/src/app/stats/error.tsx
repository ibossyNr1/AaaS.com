"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function StatsError({
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
      title="Stats unavailable"
      suggestion="We couldn't load the statistics. Try again in a moment."
    />
  );
}
