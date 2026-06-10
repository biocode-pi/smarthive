import axios from "axios";
import { hasSupabaseConfig, supabase } from "./supabase";

const configuredApiUrl = import.meta.env.VITE_API_URL ?? "/api";
const shouldUseSameOriginApi =
  window.location.protocol === "https:" && /localhost|127\.0\.0\.1/.test(configuredApiUrl);

export const API_BASE_URL = shouldUseSameOriginApi ? "/api" : configuredApiUrl;
export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  if (!hasSupabaseConfig) return config;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }

  return config;
});

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${MEDIA_BASE_URL}${path}`;
}
