"use client";

import { type ThemeConfig, generateCSSVariables } from "@/lib/theming";

interface ThemeInjectorProps {
  theme?: ThemeConfig;
}

/**
 * Injects custom workspace theme CSS variables into :root via a <style> tag.
 * Only renders when a custom theme is provided.
 *
 * Safety: The CSS is generated from structured ThemeConfig objects using
 * generateCSSVariables — no raw user HTML is ever injected.
 */
export function ThemeInjector({ theme }: ThemeInjectorProps) {
  if (!theme) return null;

  const css = generateCSSVariables(theme);

  // eslint-disable-next-line react/no-danger -- CSS from structured theme config, not user HTML
  return (
    <style
      dangerouslySetInnerHTML={{ __html: css }}
      data-theme-id={theme.id}
    />
  );
}
