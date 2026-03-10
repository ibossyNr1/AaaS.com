import { type HTMLAttributes } from "react";
import { cn } from "./cn";

type BadgeVariant = "circuit" | "red";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  circuit: "text-circuit border-circuit/20 bg-circuit/5",
  red: "text-accent-red border-accent-red/20 bg-accent-red/5",
};

export function Badge({
  className,
  variant = "circuit",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-xs font-mono uppercase tracking-wider border",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
