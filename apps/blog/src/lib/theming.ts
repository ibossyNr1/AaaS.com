import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeColors {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  text: string;
  textMuted: string;
}

export interface ThemeTypography {
  fontFamily: string;
  monoFontFamily: string;
  headingWeight: string;
}

export interface ThemeBorders {
  radius: string;
  borderWidth: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  colors: ThemeColors;
  typography?: ThemeTypography;
  borders?: ThemeBorders;
  isDark: boolean;
}

// ---------------------------------------------------------------------------
// Hex parsing
// ---------------------------------------------------------------------------

/** Converts #hex (3 or 6 digit) to "R G B" for Tailwind opacity support. */
export function parseHexToRGB(hex: string): string {
  let h = hex.replace(/^#/, "");

  // Expand shorthand: #abc -> #aabbcc
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }

  if (h.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  return `${r} ${g} ${b}`;
}

// ---------------------------------------------------------------------------
// CSS variable generation
// ---------------------------------------------------------------------------

export function generateCSSVariables(config: ThemeConfig): string {
  const { colors, typography, borders } = config;

  const lines: string[] = [":root {"];

  // Core color variables — RGB channels
  lines.push(`  --basalt-deep: ${parseHexToRGB(colors.background)};`);
  lines.push(`  --basalt-surface: ${parseHexToRGB(colors.surface)};`);
  lines.push(`  --circuit-glow: ${parseHexToRGB(colors.primary)};`);
  lines.push(`  --accent-red: ${parseHexToRGB(colors.accent)};`);
  lines.push(`  --text: ${parseHexToRGB(colors.text)};`);

  // Derived dim/glow variables using rgba
  const primaryRGB = parseHexToRGB(colors.primary);
  const accentRGB = parseHexToRGB(colors.accent);
  lines.push(`  --circuit-dim: rgba(${primaryRGB.replace(/ /g, ", ")}, 0.15);`);
  lines.push(`  --accent-red-dim: rgba(${accentRGB.replace(/ /g, ", ")}, 0.15);`);
  lines.push(`  --accent-red-glow: rgba(${accentRGB.replace(/ /g, ", ")}, 0.4);`);

  // Text muted — uses rgba with text color
  const textRGB = parseHexToRGB(colors.text);
  lines.push(`  --text-muted: rgba(${textRGB.replace(/ /g, ", ")}, 0.5);`);

  // Border
  lines.push(`  --border: ${colors.border};`);

  // Typography
  if (typography) {
    lines.push(`  --font-body: '${typography.fontFamily}', sans-serif;`);
    lines.push(`  --font-mono: '${typography.monoFontFamily}', monospace;`);
    lines.push(`  --heading-weight: ${typography.headingWeight};`);
  }

  // Borders
  if (borders) {
    lines.push(`  --radius: ${borders.radius};`);
    lines.push(`  --border-width: ${borders.borderWidth};`);
  }

  // Blend mode based on dark/light
  lines.push(`  --aura-blend: ${config.isDark ? "screen" : "multiply"};`);
  lines.push(`  --grain-opacity: ${config.isDark ? "0.6" : "0.3"};`);

  lines.push("}");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function validateThemeColors(
  colors: Partial<ThemeColors>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const hexFields: (keyof ThemeColors)[] = [
    "primary",
    "accent",
    "background",
    "surface",
    "text",
    "textMuted",
  ];

  for (const field of hexFields) {
    const val = colors[field];
    if (val !== undefined && !HEX_RE.test(val)) {
      errors.push(`${field}: "${val}" is not a valid hex color (e.g. #0af or #00aaff).`);
    }
  }

  // Border is special — can be rgba or hex
  if (colors.border !== undefined) {
    const b = colors.border;
    if (!HEX_RE.test(b) && !b.startsWith("rgba(") && !b.startsWith("rgb(")) {
      errors.push(`border: "${b}" must be a hex, rgb(), or rgba() color.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Firestore persistence
// ---------------------------------------------------------------------------

export async function getWorkspaceTheme(
  workspaceId: string,
): Promise<ThemeConfig | null> {
  const ref = doc(db, "workspaces", workspaceId, "settings", "theme");
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as ThemeConfig;
}

export async function saveWorkspaceTheme(
  workspaceId: string,
  theme: ThemeConfig,
): Promise<void> {
  const ref = doc(db, "workspaces", workspaceId, "settings", "theme");
  await setDoc(ref, theme, { merge: true });
}

// ---------------------------------------------------------------------------
// Built-in themes
// ---------------------------------------------------------------------------

export const BUILT_IN_THEMES: ThemeConfig[] = [
  {
    id: "basalt",
    name: "Basalt",
    isDark: true,
    colors: {
      primary: "#00f3ff",
      accent: "#F43F6C",
      background: "#080809",
      surface: "#1a1a1c",
      border: "rgba(255, 255, 255, 0.05)",
      text: "#e0e0e0",
      textMuted: "#808080",
    },
  },
  {
    id: "light",
    name: "Light",
    isDark: false,
    colors: {
      primary: "#007891",
      accent: "#BE2A52",
      background: "#e4e4e0",
      surface: "#ddddd5",
      border: "rgba(0, 0, 0, 0.12)",
      text: "#111113",
      textMuted: "#6b6b6e",
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    isDark: true,
    colors: {
      primary: "#38bdf8",
      accent: "#22d3ee",
      background: "#0c1222",
      surface: "#162032",
      border: "rgba(56, 189, 248, 0.08)",
      text: "#e2e8f0",
      textMuted: "#7c8da4",
    },
  },
  {
    id: "forest",
    name: "Forest",
    isDark: true,
    colors: {
      primary: "#4ade80",
      accent: "#a3e635",
      background: "#0a1208",
      surface: "#152010",
      border: "rgba(74, 222, 128, 0.08)",
      text: "#d9f0d5",
      textMuted: "#7a9a72",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    isDark: false,
    colors: {
      primary: "#f97316",
      accent: "#ef4444",
      background: "#fef3e2",
      surface: "#fde9cc",
      border: "rgba(249, 115, 22, 0.12)",
      text: "#1c1208",
      textMuted: "#8a6f4e",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    isDark: true,
    colors: {
      primary: "#a78bfa",
      accent: "#f472b6",
      background: "#0e0a1a",
      surface: "#1a1428",
      border: "rgba(167, 139, 250, 0.08)",
      text: "#e2ddf0",
      textMuted: "#8878a8",
    },
  },
];
