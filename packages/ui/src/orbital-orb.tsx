"use client";

import { useRef, useEffect, type HTMLAttributes } from "react";
import { cn } from "./cn";

interface OrbitalOrbProps extends HTMLAttributes<HTMLDivElement> {
  color?: "circuit" | "red";
  size?: number;
  followMouse?: boolean;
}

export function OrbitalOrb({
  color = "circuit",
  size = 300,
  followMouse = false,
  className,
  ...props
}: OrbitalOrbProps) {
  const orbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!followMouse || !orbRef.current) return;

    function handleMove(e: MouseEvent) {
      if (!orbRef.current) return;
      const rect = orbRef.current.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      orbRef.current.style.transform = `translate(${x}px, ${y}px)`;
    }

    const parent = orbRef.current.parentElement;
    parent?.addEventListener("mousemove", handleMove);
    return () => parent?.removeEventListener("mousemove", handleMove);
  }, [followMouse, size]);

  const glowColor =
    color === "red"
      ? "bg-accent-red/30 shadow-[0_0_120px_60px_var(--accent-red-glow)]"
      : "bg-circuit/30 shadow-[0_0_120px_60px_var(--circuit-dim)]";

  return (
    <div
      ref={orbRef}
      className={cn(
        "absolute rounded-full blur-3xl pointer-events-none transition-transform duration-700 ease-liquid",
        followMouse ? "" : "animate-orb-pulse",
        glowColor,
        className
      )}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}
