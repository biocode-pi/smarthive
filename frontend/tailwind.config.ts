import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Figtree Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        ink: "#17241c",
        border: "#dfe8dd",
        background: "#f6faf3",
        foreground: "#10251b",
        primary: {
          DEFAULT: "#1f7a4c",
          foreground: "#ffffff",
        },
        accent: {
          DEFAULT: "#d99a14",
          foreground: "#10251b",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#edf4ea",
          foreground: "#657568",
        },
        sidebar: {
          DEFAULT: "#ffffff",
          foreground: "#26382d",
          primary: "#1f653f",
          accent: "#ecf7ee",
          border: "#dfe8dd",
        },
        hive: {
          50: "#f2fbf4",
          100: "#dff6e5",
          200: "#bfe9ca",
          500: "#2e9f5f",
          600: "#23814c",
          700: "#1f653f",
          900: "#10251b",
        },
        honey: {
          50: "#fffaeb",
          100: "#fff4cf",
          200: "#ffe59a",
          400: "#f6bf3a",
          500: "#e0a526",
          600: "#b37d0e",
          // Texto sobre fundos mel (contraste AA: 6,5:1 sobre honey-100).
          700: "#7a4f00",
        },
        // Paleta unica dos graficos: entrada (verde), saida (mel), referencia (neutro).
        chart: {
          entrada: "#2e7d52",
          saida: "#e0a526",
          neutro: "#cbd5cf",
        },
        status: {
          ativa: "#2e7d52",
          observacao: "#e0a526",
          risco: "#c2410c",
          inativa: "#94a3b8",
        },
      },
      boxShadow: {
        soft: "0 18px 50px rgba(18, 38, 32, 0.08)",
        panel: "0 24px 70px rgba(16, 37, 27, 0.12)",
      },
    },
  },
  plugins: [],
} satisfies Config;
