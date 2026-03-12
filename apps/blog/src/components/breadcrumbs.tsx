interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // JSON-LD is safe: generated from our own typed data, not user input.
  // JSON.stringify handles escaping of special characters.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `https://aaas.blog${item.href}` } : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="px-4 pt-4 pb-2 max-w-4xl mx-auto">
        <ol className="flex items-center gap-1.5 font-mono text-xs text-text-muted">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="flex items-center gap-1.5">
                {index > 0 && (
                  <span className="select-none" aria-hidden="true">/</span>
                )}
                {isLast ? (
                  <span aria-current="page" className="text-text truncate max-w-[200px]">
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href}
                    className="hover:text-circuit transition-colors truncate max-w-[200px]"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
