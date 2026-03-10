"use client";

import { useEffect, useCallback } from "react";

type Theme = "dark" | "light";

interface UseScrollThemeOptions {
  threshold?: number;
  attribute?: string;
}

export function useScrollTheme(options: UseScrollThemeOptions = {}) {
  const { threshold = 50, attribute = "data-theme" } = options;

  const setTheme = useCallback(
    (theme: Theme) => {
      document.documentElement.setAttribute(attribute, theme);
    },
    [attribute]
  );

  useEffect(() => {
    let lastScroll = 0;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const currentScroll = window.scrollY;
        const delta = currentScroll - lastScroll;

        if (Math.abs(delta) > threshold) {
          const direction = delta > 0 ? "down" : "up";
          const current = document.documentElement.getAttribute(attribute) as Theme | null;

          if (direction === "down" && current !== "light") {
            setTheme("light");
          } else if (direction === "up" && current !== "dark") {
            setTheme("dark");
          }

          lastScroll = currentScroll;
        }

        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, attribute, setTheme]);

  return { setTheme };
}
