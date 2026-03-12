import { Suspense } from "react";
import type { Metadata } from "next";
import { WatchlistClient } from "./watchlist-client";

export const metadata: Metadata = {
  title: "Watchlist — AaaS Knowledge Index",
  description: "Track and monitor your favourite AI entities across the AaaS Knowledge Index.",
};

export default function WatchlistPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-text-muted font-mono text-sm animate-pulse">Loading watchlist...</span>
        </div>
      }
    >
      <WatchlistClient />
    </Suspense>
  );
}
