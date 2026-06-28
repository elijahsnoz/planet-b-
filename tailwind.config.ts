import type { Config } from "tailwindcss";

/**
 * Tailwind maps to the Planet B CSS variables (tokens/tokens.css → app/globals.css),
 * so the design system stays the single source of truth. Use classes like
 * text-ink, bg-paper, text-accent, font-display.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--pb-ink)",
        paper: "var(--pb-paper)",
        oxblood: "var(--pb-oxblood)",
        clay: "var(--pb-clay)",
        stone: "var(--pb-stone)",
        mist: "var(--pb-mist)",
        signal: "var(--pb-signal)",
        accent: "var(--pb-accent)",
        verified: "var(--pb-verified)",
        bg: "var(--pb-bg)",
        text: "var(--pb-text)",
        "text-muted": "var(--pb-text-muted)",
        border: "var(--pb-border)",
      },
      fontFamily: {
        display: "var(--pb-font-display)",
        text: "var(--pb-font-text)",
        mono: "var(--pb-font-mono)",
      },
      maxWidth: {
        measure: "var(--pb-measure)",
        container: "var(--pb-container)",
        "container-wide": "var(--pb-container-wide)",
      },
      boxShadow: {
        "museum-soft": "var(--pb-shadow-museum-soft)",
      },
      transitionTimingFunction: {
        standard: "var(--pb-ease-standard)",
        exit: "var(--pb-ease-exit)",
      },
    },
  },
  plugins: [],
};

export default config;
