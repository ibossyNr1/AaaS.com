"use client";

import { useEffect, useRef, type RefObject } from "react";

interface UseParallaxTiltOptions {
  maxTilt?: number;
  scale?: number;
  speed?: number;
}

export function useParallaxTilt<T extends HTMLElement>(
  options: UseParallaxTiltOptions = {}
): RefObject<T | null> {
  const { maxTilt = 8, scale = 1.02, speed = 400 } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.transition = `transform ${speed}ms cubic-bezier(0.23, 1, 0.32, 1)`;
    el.style.transformStyle = "preserve-3d";

    function handleMove(e: MouseEvent) {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * -maxTilt;
      const rotateY = ((e.clientX - centerX) / (rect.width / 2)) * maxTilt;
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;
    }

    function handleLeave() {
      if (el) el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, [maxTilt, scale, speed]);

  return ref;
}
