"use client";

import { useEffect, useRef } from "react";

export function ClickFlash() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick() {
      const el = ref.current;
      if (!el) return;
      el.style.opacity = "0.06";
      el.style.transition = "opacity 0.01s";
      requestAnimationFrame(() => {
        setTimeout(() => {
          el.style.transition = "opacity 0.08s ease-out";
          el.style.opacity = "0";
        }, 30);
      });
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 pointer-events-none z-[9999] opacity-0"
      style={{ background: "rgb(var(--accent-red))" }}
    />
  );
}
