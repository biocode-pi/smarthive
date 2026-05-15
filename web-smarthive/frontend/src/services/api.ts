import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";
const shouldUseSameOriginApi =
  window.location.protocol === "https:" && /localhost|127\.0\.0\.1/.test(configuredApiUrl);

export const API_BASE_URL = shouldUseSameOriginApi ? "/api" : configuredApiUrl;
export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${MEDIA_BASE_URL}${path}`;
}
