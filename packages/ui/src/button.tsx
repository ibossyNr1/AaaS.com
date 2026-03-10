import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "red" | "ghost";
type ButtonSize = "default" | "lg" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-transparent border border-text text-text font-mono uppercase tracking-[0.3rem] hover:bg-text hover:text-base hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] transition-all duration-500 ease-liquid",
  secondary:
    "bg-transparent border border-circuit text-circuit font-mono uppercase tracking-[0.2rem] hover:bg-circuit hover:text-base hover:shadow-[0_0_40px_rgba(0,243,255,0.15)] transition-all duration-500 ease-liquid",
  red: "bg-transparent border border-accent-red text-accent-red font-mono uppercase tracking-[0.2rem] hover:bg-accent-red hover:text-white hover:shadow-[0_0_40px_var(--accent-red-glow)] transition-all duration-500 ease-liquid",
  ghost:
    "bg-transparent text-text-muted font-mono uppercase tracking-[0.1rem] hover:text-circuit hover:text-glow transition-all duration-300",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-base",
  sm: "h-9 px-4 text-xs",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-circuit/50 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
