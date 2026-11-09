import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig(({ mode }) => {
  // VITE_PROXY_API permite rodar o frontend local contra outra API (ex.: a da AWS).
  const alvo = loadEnv(mode, process.cwd(), "").VITE_PROXY_API || "http://localhost:8000";
  const proxy = { target: alvo, changeOrigin: true, secure: true };

  return {
    plugins: [react(), mode === "mobile" ? basicSsl() : null].filter(Boolean),
    server: {
      port: 5173,
      host: mode === "mobile" ? "0.0.0.0" : "localhost",
      proxy: {
        "/api": proxy,
        "/uploads": proxy,
      },
    },
  };
});
