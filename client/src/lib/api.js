import axios from "axios";

const isLocalHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const configuredSocketUrl = import.meta.env.VITE_SOCKET_URL?.trim();

export const API_URL = configuredApiUrl || (isLocalHost ? "http://localhost:5000/api" : `${currentOrigin}/api`);
export const SOCKET_URL = configuredSocketUrl || (isLocalHost ? "http://localhost:5000" : currentOrigin);
export const isApiConfigured = Boolean(API_URL);
export const isUsingFallbackApiUrl = !configuredApiUrl;

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  return error?.response?.data?.message || error?.message || fallback;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000
});

api.interceptors.request.use((config) => {
  if (import.meta.env.DEV && isUsingFallbackApiUrl) {
    console.warn("VITE_API_URL is not set. Using fallback API URL:", API_URL);
  }

  const token = localStorage.getItem("skillswap_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
