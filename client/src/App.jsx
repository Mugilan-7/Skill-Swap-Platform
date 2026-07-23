import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import AppShell from "./components/AppShell.jsx";
import Chatbot from "./components/Chatbot.jsx";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Feed from "./pages/Feed.jsx";
import Browse from "./pages/Browse.jsx";
import Profile from "./pages/Profile.jsx";
import Chat from "./pages/Chat.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="premium-loader"><span aria-label="Loading SkillSwap Hub" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem("skillswap_theme") !== "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("skillswap_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    let frame = 0;
    function updateCursor(event) {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
        document.documentElement.style.setProperty("--my", `${event.clientY}px`);
        frame = 0;
      });
    }
    window.addEventListener("pointermove", updateCursor, { passive: true });
    return () => {
      window.removeEventListener("pointermove", updateCursor);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <div className="cursor-glow" />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Landing dark={dark} setDark={setDark} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppShell dark={dark} setDark={setDark}>
                  <Dashboard />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/feed"
            element={
              <ProtectedRoute>
                <AppShell dark={dark} setDark={setDark}>
                  <Feed />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/browse"
            element={
              <ProtectedRoute>
                <AppShell dark={dark} setDark={setDark}>
                  <Browse />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppShell dark={dark} setDark={setDark}>
                  <Profile />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <AppShell dark={dark} setDark={setDark}>
                  <Chat />
                </AppShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
      <Chatbot />
    </>
  );
}
