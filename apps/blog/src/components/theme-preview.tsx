"use client";

import type { ThemeConfig } from "@/lib/theming";

interface ThemePreviewProps {
  theme: ThemeConfig;
}

/**
 * Compact theme preview card for use in theme selection lists.
 * Shows background, primary/accent swatches, sample text, and a mini button.
 */
export function ThemePreview({ theme }: ThemePreviewProps) {
  const { colors, borders } = theme;
  const radius = borders?.radius ?? "8px";

  return (
    <div
      className="w-full overflow-hidden rounded-lg border transition-shadow hover:shadow-lg"
      style={{
        background: colors.background,
        borderColor: colors.border,
        borderRadius: radius,
      }}
    >
      {/* Color swatch bar */}
      <div className="flex h-2">
        <div className="flex-1" style={{ background: colors.primary }} />
        <div className="flex-1" style={{ background: colors.accent }} />
        <div className="flex-1" style={{ background: colors.surface }} />
      </div>

      <div className="space-y-2.5 p-3">
        {/* Theme name */}
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold"
            style={{ color: colors.text }}
          >
            {theme.name}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
            style={{
              background: `${colors.primary}18`,
              color: colors.primary,
            }}
          >
            {theme.isDark ? "Dark" : "Light"}
          </span>
        </div>

        {/* Sample text */}
        <p className="text-[10px] leading-relaxed" style={{ color: colors.textMuted }}>
          The quick brown fox jumps over the lazy dog.
        </p>

        {/* Primary / accent circles + mini button */}
        <div className="flex items-center gap-2">
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: colors.primary }}
            title="Primary"
          />
          <div
            className="h-4 w-4 rounded-full"
            style={{ background: colors.accent }}
            title="Accent"
          />
          <button
            type="button"
            className="ml-auto rounded px-2 py-0.5 text-[9px] font-semibold"
            style={{
              background: colors.primary,
              color: colors.background,
              borderRadius: radius,
            }}
          >
            Button
          </button>
        </div>
      </div>
    </div>
  );
}
