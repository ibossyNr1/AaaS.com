import { cn } from "./cn";

interface AuraBlobsProps {
  className?: string;
}

export function AuraBlobs({ className }: AuraBlobsProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
    >
      <div
        className="absolute -top-32 -left-32 w-48 md:w-96 h-48 md:h-96 rounded-full bg-circuit/10 blur-3xl animate-aura-drift"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-1/2 -right-24 w-40 md:w-80 h-40 md:h-80 rounded-full bg-accent-red/10 blur-3xl animate-aura-drift"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute -bottom-20 left-1/3 w-36 md:w-72 h-36 md:h-72 rounded-full bg-circuit/8 blur-3xl animate-aura-drift"
        style={{ animationDelay: "4s" }}
      />
    </div>
  );
}
