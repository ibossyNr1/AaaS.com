"use client";

import { useCallback, useState } from "react";
import {
  type ThemeConfig,
  type ThemeColors,
  BUILT_IN_THEMES,
  validateThemeColors,
  generateCSSVariables,
} from "@/lib/theming";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Montserrat",
  "Nunito",
  "Raleway",
  "Source Sans 3",
  "DM Sans",
];

const MONO_FONTS = [
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "IBM Plex Mono",
  "Roboto Mono",
];

const DEFAULT_THEME = BUILT_IN_THEMES[0]; // basalt

/** Ensure a color value is a hex for <input type="color">. Fallback to #000000. */
function toHexInput(val: string): string {
  if (/^#[0-9a-fA-F]{6}$/.test(val)) return val;
  if (/^#[0-9a-fA-F]{3}$/.test(val)) {
    const h = val.replace("#", "");
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return "#000000";
}

// ---------------------------------------------------------------------------
// Color picker row
// ---------------------------------------------------------------------------

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-[rgb(var(--text))] capitalize">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toHexInput(value)}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-[var(--border)] bg-transparent p-0"
        />
        <span className="font-mono text-xs text-[rgba(var(--text),0.5)] w-20 text-right">
          {value}
        </span>
      </div>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Theme editor
// ---------------------------------------------------------------------------

interface ThemeEditorProps {
  initialTheme?: ThemeConfig;
  onSave: (theme: ThemeConfig) => void;
}

export function ThemeEditor({ initialTheme, onSave }: ThemeEditorProps) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme ?? DEFAULT_THEME);
  const [errors, setErrors] = useState<string[]>([]);

  // Derived preview CSS
  const previewCSS = generateCSSVariables(theme);

  // -- Updaters ---------------------------------------------------------------

  const setColor = useCallback(
    (key: keyof ThemeColors, value: string) => {
      setTheme((prev) => ({
        ...prev,
        colors: { ...prev.colors, [key]: value },
      }));
    },
    [],
  );

  const setFontFamily = useCallback((value: string) => {
    setTheme((prev) => ({
      ...prev,
      typography: {
        fontFamily: value,
        monoFontFamily: prev.typography?.monoFontFamily ?? "JetBrains Mono",
        headingWeight: prev.typography?.headingWeight ?? "700",
      },
    }));
  }, []);

  const setMonoFont = useCallback((value: string) => {
    setTheme((prev) => ({
      ...prev,
      typography: {
        fontFamily: prev.typography?.fontFamily ?? "Inter",
        monoFontFamily: value,
        headingWeight: prev.typography?.headingWeight ?? "700",
      },
    }));
  }, []);

  const setRadius = useCallback((value: string) => {
    setTheme((prev) => ({
      ...prev,
      borders: {
        radius: value,
        borderWidth: prev.borders?.borderWidth ?? "1px",
      },
    }));
  }, []);

  const toggleDark = useCallback(() => {
    setTheme((prev) => ({ ...prev, isDark: !prev.isDark }));
  }, []);

  const applyBuiltIn = useCallback((preset: ThemeConfig) => {
    setTheme(preset);
    setErrors([]);
  }, []);

  const handleReset = useCallback(() => {
    setTheme(DEFAULT_THEME);
    setErrors([]);
  }, []);

  const handleSave = useCallback(() => {
    const result = validateThemeColors(theme.colors);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    setErrors([]);
    onSave(theme);
  }, [theme, onSave]);

  // -- Render -----------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Editor panel */}
      <div className="flex-1 space-y-6">
        {/* Built-in theme selector */}
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[rgba(var(--text),0.5)]">
            Presets
          </h3>
          <div className="flex flex-wrap gap-2">
            {BUILT_IN_THEMES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyBuiltIn(preset)}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  theme.id === preset.id
                    ? "border-[rgb(var(--circuit-glow))] bg-[rgba(var(--circuit-glow),0.1)] text-[rgb(var(--circuit-glow))]"
                    : "border-[var(--border)] text-[rgb(var(--text))] hover:border-[rgba(var(--circuit-glow),0.3)]"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </section>

        {/* Color pickers */}
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[rgba(var(--text),0.5)]">
            Colors
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ColorRow label="Primary" value={theme.colors.primary} onChange={(v) => setColor("primary", v)} />
            <ColorRow label="Accent" value={theme.colors.accent} onChange={(v) => setColor("accent", v)} />
            <ColorRow label="Background" value={theme.colors.background} onChange={(v) => setColor("background", v)} />
            <ColorRow label="Surface" value={theme.colors.surface} onChange={(v) => setColor("surface", v)} />
            <ColorRow label="Text" value={theme.colors.text} onChange={(v) => setColor("text", v)} />
            <ColorRow label="Text Muted" value={theme.colors.textMuted} onChange={(v) => setColor("textMuted", v)} />
          </div>
        </section>

        {/* Dark / light toggle */}
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[rgba(var(--text),0.5)]">
            Mode
          </h3>
          <button
            type="button"
            onClick={toggleDark}
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[rgb(var(--text))] transition-colors hover:border-[rgba(var(--circuit-glow),0.3)]"
          >
            {theme.isDark ? "Dark" : "Light"} — click to toggle
          </button>
        </section>

        {/* Typography */}
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[rgba(var(--text),0.5)]">
            Typography
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[rgba(var(--text),0.5)]">Body Font</span>
              <select
                value={theme.typography?.fontFamily ?? "Inter"}
                onChange={(e) => setFontFamily(e.target.value)}
                className="rounded-md border border-[var(--border)] bg-[rgb(var(--basalt-surface))] px-3 py-2 text-sm text-[rgb(var(--text))]"
              >
                {GOOGLE_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-[rgba(var(--text),0.5)]">Mono Font</span>
              <select
                value={theme.typography?.monoFontFamily ?? "JetBrains Mono"}
                onChange={(e) => setMonoFont(e.target.value)}
                className="rounded-md border border-[var(--border)] bg-[rgb(var(--basalt-surface))] px-3 py-2 text-sm text-[rgb(var(--text))]"
              >
                {MONO_FONTS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Border radius */}
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[rgba(var(--text),0.5)]">
            Borders
          </h3>
          <label className="flex items-center gap-4">
            <span className="text-sm text-[rgb(var(--text))]">Radius</span>
            <input
              type="range"
              min="0"
              max="24"
              step="1"
              value={parseFloat(theme.borders?.radius ?? "12")}
              onChange={(e) => setRadius(`${e.target.value}px`)}
              className="flex-1"
            />
            <span className="w-12 text-right font-mono text-xs text-[rgba(var(--text),0.5)]">
              {theme.borders?.radius ?? "12px"}
            </span>
          </label>
        </section>

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="rounded-md border border-red-500/30 bg-red-500/5 p-3">
            <p className="mb-1 text-xs font-semibold text-red-400">Validation errors:</p>
            <ul className="list-inside list-disc text-xs text-red-400/80">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-[rgb(var(--circuit-glow))] px-5 py-2 text-sm font-semibold text-[rgb(var(--basalt-deep))] transition-opacity hover:opacity-90"
          >
            Save Theme
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-[var(--border)] px-5 py-2 text-sm text-[rgb(var(--text))] transition-colors hover:border-[rgba(var(--circuit-glow),0.3)]"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Live preview pane */}
      <div className="w-full lg:w-80">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[rgba(var(--text),0.5)]">
          Live Preview
        </h3>
        <div className="relative isolate overflow-hidden rounded-lg border border-[var(--border)]">
          {/* Scoped preview styles */}
          <style>{`
            .theme-preview-scope {
              ${previewCSS.replace(":root {", "").replace(/}$/, "")}
            }
          `}</style>
          <div
            className="theme-preview-scope p-5 space-y-4"
            style={{
              background: theme.colors.background,
              color: theme.colors.text,
            }}
          >
            {/* Mini card */}
            <div
              className="rounded-lg p-4"
              style={{
                background: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borders?.radius ?? "12px",
              }}
            >
              <p
                className="text-sm font-semibold mb-1"
                style={{ color: theme.colors.text }}
              >
                Sample Card
              </p>
              <p className="text-xs" style={{ color: theme.colors.textMuted }}>
                A preview of your workspace theme.
              </p>

              {/* Badge */}
              <span
                className="mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: `${theme.colors.primary}20`,
                  color: theme.colors.primary,
                }}
              >
                Badge
              </span>
            </div>

            {/* Button */}
            <button
              type="button"
              className="rounded-md px-4 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
              style={{
                background: theme.colors.primary,
                color: theme.colors.background,
                borderRadius: theme.borders?.radius ?? "12px",
              }}
            >
              Primary Button
            </button>

            {/* Accent swatch row */}
            <div className="flex gap-2 items-center">
              <div
                className="h-5 w-5 rounded-full"
                style={{ background: theme.colors.primary }}
                title="Primary"
              />
              <div
                className="h-5 w-5 rounded-full"
                style={{ background: theme.colors.accent }}
                title="Accent"
              />
              <span className="text-[10px] ml-auto" style={{ color: theme.colors.textMuted }}>
                {theme.isDark ? "Dark" : "Light"} mode
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
