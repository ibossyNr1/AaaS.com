"use client";

import { ErrorFallback } from "@/components/error-fallback";

export default function ActivityError({
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
      title="Activity feed unavailable"
      suggestion="We couldn't load recent activity. Try again in a moment."
    />
  );
}
