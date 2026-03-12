import { cn } from "@aaas/ui";
import { computeGrade } from "@/lib/grades";

interface GradeBadgeProps {
  composite: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-12 h-12 text-base",
};

export function GradeBadge({ composite, size = "md", className }: GradeBadgeProps) {
  const grade = computeGrade(composite);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-md font-mono font-bold shrink-0",
        SIZES[size],
        grade.color,
        grade.bgColor,
        className,
      )}
      title={`${grade.letter} — ${grade.label}`}
    >
      {grade.letter}
    </span>
  );
}
