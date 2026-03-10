import type { Entity } from "@/lib/types";
import { generateJsonLd } from "@/lib/schemas";

export function EntityJsonLd({ entity }: { entity: Entity }) {
  const jsonLd = generateJsonLd(entity);
  // JSON-LD is safe: generated from our own typed data, not user input.
  // JSON.stringify handles escaping of special characters.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
