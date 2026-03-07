import Link from "next/link";

export function BlogFooter() {
  return (
    <footer className="border-t border-border bg-base py-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <Link href="/" className="hover:text-text transition-colors">
            AaaS.blog
          </Link>
          <a
            href="https://agents-as-a-service.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text transition-colors"
          >
            Platform
          </a>
        </div>
        <p className="text-xs text-text-muted">
          &copy; {new Date().getFullYear()} Agent-as-a-Service
        </p>
      </div>
    </footer>
  );
}
