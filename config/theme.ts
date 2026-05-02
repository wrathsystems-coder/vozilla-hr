// Brand theme tokeni. Sprint 1 importira u globals.css preko @theme {}.
// HEX kodove agent smije generirati (CLAUDE.md rule #1 iznimka), korisnik
// finalizira u Sprintu 7.

export const theme = {
  colors: {
    brand: {
      primary: "#000000", // [XXX_BRAND_PRIMARY: korisnik finalizira]
      accent: "#FFC107", // [XXX_BRAND_ACCENT: korisnik finalizira]
    },
    text: { DEFAULT: "#0A0A0A", muted: "#525252", inverse: "#FFFFFF" },
    surface: { DEFAULT: "#FFFFFF", muted: "#F5F5F5", border: "#E5E5E5" },
    state: {
      success: "#16A34A",
      warning: "#EAB308",
      error: "#DC2626",
      info: "#2563EB",
    },
  },
  font: {
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, "Cascadia Code", Consolas, monospace',
  },
  radius: { sm: "4px", DEFAULT: "8px", md: "12px", lg: "16px", full: "9999px" },
} as const;

export type Theme = typeof theme;
