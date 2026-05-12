import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, LogOut, MessageCircle, Moon, Newspaper, Search, Sun, UserRound, LayoutDashboard } from "lucide-react";
import { io } from "socket.io-client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { SOCKET_URL } from "../lib/api.js";
import api from "../lib/api.js";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/feed", label: "Feed", icon: Newspaper },
  { to: "/browse", label: "Browse", icon: Search },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: UserRound }
];

export default function AppShell({ children, dark, setDark }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);

  const unread = notifications.filter((item) => !item.read).length;
  const socket = useMemo(() => {
    const token = localStorage.getItem("skillswap_token");
    return token ? io(SOCKET_URL, { auth: { token } }) : null;
  }, []);

  useEffect(() => {
    api.get("/notifications").then((res) => setNotifications(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("notification:new", (notification) => setNotifications((prev) => [notification, ...prev]));
    return () => socket.disconnect();
  }, [socket]);

  return (
    <div className="min-h-screen bg-mist text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="text-lg font-bold text-teal-800 dark:text-teal-300">SkillSwap Hub</Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
                  }`
                }
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button className="relative rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900" title="Notifications">
              <Bell size={19} />
              {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-coral px-1.5 text-xs font-bold text-white">{unread}</span>}
            </button>
            <button onClick={() => setDark(!dark)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900" title="Toggle theme">
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-900"
              title="Log out"
            >
              <LogOut size={19} />
            </button>
            <div className="hidden items-center gap-2 pl-2 text-sm md:flex">
              <img className="h-8 w-8 rounded-full object-cover" src={user?.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}`} alt="" />
              <span className="font-semibold">{user?.name}</span>
            </div>
          </div>
        </div>
        <nav className="grid grid-cols-5 border-t border-slate-200 md:hidden dark:border-slate-800">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className="flex flex-col items-center gap-1 py-2 text-xs text-slate-600 dark:text-slate-300">
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
