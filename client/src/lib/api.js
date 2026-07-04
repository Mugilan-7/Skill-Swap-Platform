import axios from "axios";

const isLocalHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const API_URL = import.meta.env.VITE_API_URL || (isLocalHost ? "http://localhost:5000/api" : "");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isLocalHost ? "http://localhost:5000" : "");
export const isApiConfigured = Boolean(API_URL);

export function getApiErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (error?.code === "API_URL_MISSING") {
    return "Login is not available yet because the backend API URL is not configured for this deployed site.";
  }
  return error?.response?.data?.message || error?.message || fallback;
}

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  if (!API_URL) {
    const error = new Error("Backend API URL is not configured for this deployment.");
    error.code = "API_URL_MISSING";
    throw error;
  }

  const token = localStorage.getItem("skillswap_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
