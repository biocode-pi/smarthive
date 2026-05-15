import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "mobile" ? basicSsl() : null].filter(Boolean),
  server: {
    port: 5173,
    host: mode === "mobile" ? "0.0.0.0" : "localhost",
    proxy: {
      "/api": "http://localhost:8000",
      "/uploads": "http://localhost:8000",
    },
  },
}));
