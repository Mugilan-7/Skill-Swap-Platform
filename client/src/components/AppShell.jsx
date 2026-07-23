import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, LayoutDashboard, LogOut, MessageCircle, Moon, Newspaper, Search, Sun, UserRound } from "lucide-react";
import { io } from "socket.io-client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api, { SOCKET_URL, isApiConfigured } from "../lib/api.js";

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
    return token && SOCKET_URL ? io(SOCKET_URL, { auth: { token } }) : null;
  }, []);

  useEffect(() => {
    if (!isApiConfigured) return;
    api.get("/notifications").then((res) => setNotifications(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on("notification:new", (notification) => setNotifications((prev) => [notification, ...prev]));
    return () => socket.disconnect();
  }, [socket]);

  return (
    <div className="app-frame min-h-screen text-slate-100">
      <div className="code-rain" aria-hidden="true">
        <span>{"const mentor = match.skills();"}</span>
        <span>{"swap.status === 'accepted'"}</span>
        <span>{"ai.coach.stream(reply)"}</span>
        <span>{"profile.badges.push('pro')"}</span>
        <span>{"socket.emit('message:new')"}</span>
        <span>{"learn.repeat().ship()"}</span>
      </div>

      <header className="sticky top-3 z-30 px-3">
        <div className="panel mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="group flex items-center gap-3 text-lg font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-400 text-sm text-white shadow-[0_0_30px_rgba(34,211,238,0.35)]">S</span>
            <span className="bg-gradient-to-r from-white via-cyan-200 to-fuchsia-200 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(34,211,238,0.35)]">SkillSwap Hub</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `relative inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive ? "text-white" : "text-slate-300 hover:bg-white/5 hover:text-cyan-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} />
                    {label}
                    {isActive && <span className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-gradient-to-r from-cyan-300 via-violet-300 to-pink-300 shadow-[0_0_16px_rgba(34,211,238,0.75)]" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="relative rounded-lg border border-cyan-300/10 bg-white/5 p-2 text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100 hover:shadow-[0_0_24px_rgba(34,211,238,0.18)]" title="Notifications">
              <Bell size={19} />
              {unread > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-pink-500 px-1.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(244,114,182,0.65)]">{unread}</span>}
            </button>
            <button onClick={() => setDark(!dark)} className="rounded-lg border border-cyan-300/10 bg-white/5 p-2 text-slate-200 transition hover:border-cyan-300/40 hover:text-cyan-100" title="Toggle theme">
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="rounded-lg border border-cyan-300/10 bg-white/5 p-2 text-slate-200 transition hover:border-pink-300/40 hover:text-pink-100"
              title="Log out"
            >
              <LogOut size={19} />
            </button>
            <div className="hidden items-center gap-2 pl-2 text-sm md:flex">
              <img className="h-8 w-8 rounded-lg border border-cyan-200/20 object-cover shadow-[0_0_18px_rgba(34,211,238,0.15)]" src={user?.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}`} alt="" />
              <span className="font-semibold text-slate-100">{user?.name}</span>
            </div>
          </div>
        </div>

        <nav className="panel mx-auto mt-2 grid max-w-7xl grid-cols-5 md:hidden">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex flex-col items-center gap-1 rounded-lg py-2 text-xs transition ${isActive ? "text-cyan-100" : "text-slate-400 hover:text-cyan-100"}`}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="page-surface mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
