import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("skillswap_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("skillswap_token")));

  useEffect(() => {
    const token = localStorage.getItem("skillswap_token");
    if (!token) return;
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("skillswap_user", JSON.stringify(res.data));
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data);
  }

  async function register(payload) {
    const { data } = await api.post("/auth/register", payload);
    return data;
  }

  function persistSession(data) {
    localStorage.setItem("skillswap_token", data.token);
    localStorage.setItem("skillswap_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem("skillswap_token");
    localStorage.removeItem("skillswap_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, setUser, login, register, logout, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
