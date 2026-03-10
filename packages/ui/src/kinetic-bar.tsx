import { cn } from "./cn";

interface KineticBarProps {
  variant?: "circuit" | "red";
  className?: string;
}

export function KineticBar({ variant = "circuit", className }: KineticBarProps) {
  return (
    <div className={cn("kinetic-bar", variant === "red" && "red", className)} />
  );
}
