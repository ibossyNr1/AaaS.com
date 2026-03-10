import { cn } from "@aaas/ui";

interface SectionTopicProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTopic({ children, className }: SectionTopicProps) {
  return (
    <div
      className={cn(
        "font-mono text-[0.65rem] text-accent-red uppercase tracking-[0.3rem] flex items-center gap-4 mb-8",
        "before:content-[''] before:w-6 before:h-0.5 before:bg-accent-red before:shadow-[0_0_8px_var(--accent-red-glow)] before:shrink-0",
        "after:content-[''] after:flex-1 after:h-px after:bg-gradient-to-r after:from-accent-red/15 after:to-transparent",
        className
      )}
    >
      {children}
    </div>
  );
}
