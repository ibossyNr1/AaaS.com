"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PageTracker({
  entityType,
  entitySlug,
}: {
  entityType?: string;
  entitySlug?: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Fire and forget - don't block rendering
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        entityType,
        entitySlug,
        referrer: document.referrer || undefined,
      }),
    }).catch(() => {}); // Silently ignore errors
  }, [pathname, entityType, entitySlug]);

  return null;
}
