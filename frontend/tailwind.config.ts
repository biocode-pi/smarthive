import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Lato"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Lato"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Lato"', "ui-sans-serif", "system-ui", "sans-serif"],
        brand: ['"Poppins"', "ui-sans-serif", "system-ui", "sans-serif"],
        expo: ['"Archivo Variable"', '"Lato"', "ui-sans-serif", "system-ui", "sans-serif"],
        dados: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
        tagline: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#121515",
        border: "#f0e2a6",
        background: "#fff5c5",
        foreground: "#121515",
        sidebar: {
          border: "#f0e2a6",
        },
        hive: {
          50: "#fff2bd",
          100: "#fae596",
          200: "#f5c618",
          500: "#f5c618",
          600: "#e58d0c",
          700: "#8f4f00",
          800: "#7a4300",
          900: "#121515",
        },
        honey: {
          50: "#fff5c5",
          100: "#fae596",
          200: "#fff2bd",
          400: "#f5c618",
          500: "#ffcc00",
          600: "#e58d0c",
          700: "#645f46",
        },
        chart: {
          entrada: "#c97200",
          saida: "#645f46",
          neutro: "#e9e1bf",
        },
        status: {
          ativa: "#cff8cc",
          "ativa-texto": "#1a6b12",
          observacao: "#fae596",
          "observacao-texto": "#645f46",
          risco: "#f6c0c0",
          "risco-texto": "#a40000",
          inativa: "#d9d9d9",
        },
      },
      borderRadius: {
        card: "20px",
        field: "10px",
      },
      boxShadow: {
        app: "0 4px 4px rgba(0, 0, 0, 0.25)",
        soft: "0 4px 4px rgba(0, 0, 0, 0.12)",
        panel: "0 4px 4px rgba(0, 0, 0, 0.25)",
      },
    },
  },
  plugins: [],
} satisfies Config;
