import axios from "axios";

const isLocalHost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const API_URL = import.meta.env.VITE_API_URL || (isLocalHost ? "http://localhost:5000/api" : "");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (isLocalHost ? "http://localhost:5000" : "");

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  if (!API_URL) {
    throw new Error("Backend API URL is not configured for this deployment.");
  }

  const token = localStorage.getItem("skillswap_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
