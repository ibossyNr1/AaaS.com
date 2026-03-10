import type { Config } from "tailwindcss";

const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        base: "rgb(var(--basalt-deep) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--basalt-surface) / <alpha-value>)",
          bright: "rgb(var(--basalt-bright) / <alpha-value>)",
        },
        border: "var(--border)",
        text: {
          DEFAULT: "rgb(var(--text) / <alpha-value>)",
          muted: "var(--text-muted)",
        },
        circuit: {
          DEFAULT: "rgb(var(--circuit-glow) / <alpha-value>)",
          dim: "var(--circuit-dim)",
        },
        "accent-red": {
          DEFAULT: "rgb(var(--accent-red) / <alpha-value>)",
          dim: "var(--accent-red-dim)",
          glow: "var(--accent-red-glow)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        liquid: "var(--liquid-ease)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        "fade-up": "fadeUp 0.5s ease-out forwards",
        "circuit-flow": "circuitFlow 10s linear infinite",
        "orb-pulse": "orbPulse 4s ease-in-out infinite",
        orbit: "orbit 20s linear infinite",
        sweep: "sweep 4s var(--liquid-ease) infinite",
        "aura-drift": "auraDrift 8s ease-in-out infinite",
        "wire-flow": "wireFlow 2s linear infinite",
        heartbeat: "heartbeat 2s ease-in-out infinite",
        "tape-scroll": "tapeScroll 20s linear infinite",
        "feed-pulse": "feedPulse 2s ease-in-out infinite",
        "pulse-dot": "pulseDot 2s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        circuitFlow: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        orbPulse: {
          "0%, 100%": {
            transform: "scale(1)",
            boxShadow: "0 0 30px var(--circuit-dim)",
          },
          "50%": {
            transform: "scale(1.1)",
            boxShadow: "0 0 60px rgb(var(--circuit-glow))",
          },
        },
        orbit: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        sweep: {
          "0%": { transform: "translateX(-120px)" },
          "100%": { transform: "translateX(calc(100vw + 120px))" },
        },
        auraDrift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "25%": { transform: "translate(30px, -20px) scale(1.05)" },
          "50%": { transform: "translate(-20px, 15px) scale(0.95)" },
          "75%": { transform: "translate(15px, 25px) scale(1.02)" },
        },
        wireFlow: {
          "0%": { strokeDashoffset: "20" },
          "100%": { strokeDashoffset: "0" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.15)", opacity: "0.8" },
        },
        tapeScroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        feedPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        pulseDot: {
          "0%, 100%": {
            boxShadow: "0 0 4px rgb(var(--circuit-glow))",
          },
          "50%": {
            boxShadow:
              "0 0 12px rgb(var(--circuit-glow)), 0 0 24px rgba(0, 243, 255, 0.3)",
          },
        },
      },
    },
  },
};

export default sharedConfig;
