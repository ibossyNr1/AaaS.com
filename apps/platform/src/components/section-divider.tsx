import { cn } from "@aaas/ui";

interface SectionDividerProps {
  className?: string;
}

export function SectionDivider({ className }: SectionDividerProps) {
  return (
    <div
      className={cn(
        "h-px max-w-[1400px] mx-auto",
        className
      )}
      style={{
        background: "linear-gradient(90deg, transparent, var(--accent-red-dim), var(--circuit-dim), var(--accent-red-dim), transparent)",
      }}
    />
  );
}
