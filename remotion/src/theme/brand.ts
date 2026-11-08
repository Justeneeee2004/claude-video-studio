import { fonts } from "./fonts";

/**
 * Brand tokens. Edit once; every scene uses these as defaults.
 * Per-video overrides: pass colors through composition props (see compositions/schema.ts).
 */
export const brand = {
  name: "YourBrand",
  url: "yourbrand.com",
  colors: {
    bg: "#0B0F19",
    bg2: "#1E1B4B",
    surface: "rgba(255, 255, 255, 0.06)",
    border: "rgba(255, 255, 255, 0.12)",
    primary: "#6366F1",
    accent: "#22D3EE",
    text: "#F9FAFB",
    textSoft: "#D4D4D8",
    muted: "#A1A1AA",
    success: "#34D399",
    danger: "#F43F5E",
  },
  fonts,
  radius: 28,
} as const;
