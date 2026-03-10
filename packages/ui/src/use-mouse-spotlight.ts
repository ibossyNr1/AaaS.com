"use client";

import { useEffect, useRef, type RefObject } from "react";

interface UseMouseSpotlightOptions {
  radius?: number;
  color?: string;
  opacity?: number;
}

export function useMouseSpotlight<T extends HTMLElement>(
  options: UseMouseSpotlightOptions = {}
): RefObject<T | null> {
  const { radius = 600, color = "rgba(0,243,255,0.06)", opacity = 1 } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--spotlight-x", `${x}px`);
      el.style.setProperty("--spotlight-y", `${y}px`);
      el.style.setProperty(
        "--spotlight-bg",
        `radial-gradient(${radius}px circle at ${x}px ${y}px, ${color}, transparent 40%)`
      );
    }

    function handleEnter() {
      if (el) el.style.setProperty("--spotlight-opacity", String(opacity));
    }

    function handleLeave() {
      if (el) el.style.setProperty("--spotlight-opacity", "0");
    }

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [radius, color, opacity]);

  return ref;
}
