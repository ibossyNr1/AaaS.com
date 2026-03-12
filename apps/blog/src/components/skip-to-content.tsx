"use client";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="fixed top-0 left-0 z-[100] -translate-y-full focus:translate-y-0 bg-circuit text-base px-4 py-2 text-sm font-medium transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-circuit focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
