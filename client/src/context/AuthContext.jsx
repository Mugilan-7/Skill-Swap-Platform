import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";
import { isApiConfigured } from "../lib/api.js";

const AuthContext = createContext(null);
const DEMO_USERS_KEY = "skillswap_demo_users";

function getDemoUsers() {
  try {
    return JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveDemoUsers(users) {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function createDemoSession(user) {
  return {
    token: `demo-${user._id}-${Date.now()}`,
    user
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("skillswap_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("skillswap_token")));

  useEffect(() => {
    const token = localStorage.getItem("skillswap_token");
    if (!token) return;
    if (!isApiConfigured || token.startsWith("demo-")) {
      setLoading(false);
      return;
    }
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
    if (!isApiConfigured) {
      const normalizedEmail = email.trim().toLowerCase();
      const users = getDemoUsers();
      let user = users.find((item) => item.email === normalizedEmail);
      if (user && user.password !== password) {
        throw new Error("Invalid password for this browser demo account.");
      }
      if (!user) {
        const name = normalizedEmail
          .split("@")[0]
          .split(/[._-]/)
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ") || "Demo User";
        user = {
          _id: `demo-user-${Date.now()}`,
          name,
          email: normalizedEmail,
          password,
          category: "coding",
          skillsOffered: ["JavaScript", "React"],
          skillsWanted: ["UI Design", "Communication"],
          bio: "Demo profile for the GitHub Pages version.",
          profilePicture: "",
          emailVerified: true,
          badges: ["Beginner"],
          ratingAverage: 0,
          ratingCount: 0
        };
        saveDemoUsers([...users, user]);
      }
      const { password: _password, ...safeUser } = user;
      persistSession(createDemoSession(safeUser));
      return;
    }
    const { data } = await api.post("/auth/login", { email, password });
    persistSession(data);
  }

  async function register(payload) {
    if (!isApiConfigured) {
      const normalizedEmail = payload.email.trim().toLowerCase();
      const users = getDemoUsers();
      if (users.some((user) => user.email === normalizedEmail)) {
        throw new Error("Email already registered in this browser demo.");
      }
      const user = {
        _id: `demo-user-${Date.now()}`,
        name: payload.name.trim(),
        email: normalizedEmail,
        password: payload.password,
        category: payload.category || "coding",
        skillsOffered: payload.skillsOffered
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        skillsWanted: payload.skillsWanted
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        bio: "",
        profilePicture: "",
        emailVerified: true,
        badges: ["Beginner"],
        ratingAverage: 0,
        ratingCount: 0
      };
      saveDemoUsers([...users, user]);
      const { password: _password, ...safeUser } = user;
      return {
        message: "Demo account created. You can log in on this browser now.",
        user: safeUser
      };
    }
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
