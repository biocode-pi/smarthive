import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
          100: "#fff4cf",
          200: "#ffe59a",
          400: "#f6bf3a",
          500: "#d99a14",
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
