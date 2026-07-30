import { useEffect, useMemo, useRef, useState } from "react";
import { Send } from "lucide-react";
import { io } from "socket.io-client";
import api, { SOCKET_URL, getApiErrorMessage, isApiConfigured } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Chat() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [unread, setUnread] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const socket = useMemo(() => {
    const token = localStorage.getItem("skillswap_token");
    return token && SOCKET_URL ? io(SOCKET_URL, { auth: { token }, autoConnect: false }) : null;
  }, []);

  useEffect(() => {
    if (!isApiConfigured) {
      setError("Chat is not available yet because the backend API URL is not configured for this deployed site.");
      return undefined;
    }

    if (socket) {
      socket.connect();
      socket.on("connect_error", (err) => setError(err.message || "Chat connection failed."));
    }

    api
      .get("/swaps")
      .then((res) => {
        const accepted = Array.isArray(res.data?.accepted) ? res.data.accepted.filter(hasParticipants) : [];
        setSwaps(accepted);
        setActive((current) => current || accepted[0] || null);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Could not load chats.")));

    return () => {
      socket?.off("connect_error");
      socket?.disconnect();
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, active]);

  useEffect(() => {
    if (!active) return;
    setError("");
    setUnread((prev) => ({ ...prev, [active._id]: 0 }));

    api
      .get(`/chats/${active._id}/messages`)
      .then((res) => setMessages(Array.isArray(res.data) ? res.data : []))
      .catch((err) => setError(getApiErrorMessage(err, "Could not load messages.")));

    if (!socket) {
      setError("Real-time chat is not connected.");
      return;
    }

    socket.emit("swap:join", active._id, (response) => {
      if (response && !response.ok) setError(response.message || "Could not join this chat.");
    });
    const handler = (message) => {
      if (String(message.swap) === String(active._id)) {
        setMessages((prev) => (prev.some((item) => item._id === message._id) ? prev : [...prev, message]));
        return;
      }
      setUnread((prev) => ({ ...prev, [message.swap]: (prev[message.swap] || 0) + 1 }));
    };
    const typingHandler = ({ swapId, userId, typing }) => {
      setTypingUsers((prev) => ({ ...prev, [swapId]: typing ? userId : null }));
    };
    const onlineHandler = ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: true }));
    };
    socket.on("message:new", handler);
    socket.on("typing", typingHandler);
    socket.on("user:online", onlineHandler);
    return () => {
      socket.off("message:new", handler);
      socket.off("typing", typingHandler);
      socket.off("user:online", onlineHandler);
    };
  }, [active, socket]);

  function hasParticipants(swap) {
    return swap?.from && swap?.to;
  }

  function otherPerson(swap) {
    if (!swap || !user) return null;
    return String(swap.from?._id || swap.from) === String(user._id) ? swap.to : swap.from;
  }

  function send(e) {
    e.preventDefault();
    const messageText = text.trim();
    if (!messageText || !active) return;
    if (!socket) {
      setError("Chat is not connected.");
      return;
    }
    socket.emit("message:send", { swapId: active._id, text: messageText }, (response) => {
      if (response && !response.ok) {
        setError(response.message || "Could not send message.");
        setText(messageText);
      }
    });
    setText("");
    socket.emit("typing", { swapId: active._id, typing: false });
  }

  function updateText(value) {
    setText(value);
    if (!socket || !active) return;
    socket.emit("typing", { swapId: active._id, typing: Boolean(value.trim()) });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit("typing", { swapId: active._id, typing: false });
    }, 1200);
  }

  return (
    <div className="panel grid min-h-[72vh] overflow-hidden md:grid-cols-[320px_1fr]">
      <aside className="border-b border-cyan-200/10 md:border-b-0 md:border-r">
        <div className="border-b border-cyan-200/10 p-4 font-semibold text-white">Accepted chats</div>
        {error && <div className="m-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {swaps.map((swap) => {
            const person = otherPerson(swap);
            if (!person) return null;
            return (
              <button key={swap._id} onClick={() => setActive(swap)} className={`flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/[0.06] ${active?._id === swap._id ? "bg-cyan-400/10 text-cyan-100" : ""}`}>
                <img className="h-10 w-10 rounded-lg border border-cyan-200/20 object-cover" src={person.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${person.name}`} alt="" />
                <div>
                  <div className="flex items-center gap-2 font-semibold">
                    <span>{person.name}</span>
                    <span className={`h-2 w-2 rounded-full ${onlineUsers[person._id] ? "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.8)]" : "bg-slate-500"}`} />
                    {unread[swap._id] > 0 && <span className="rounded-full bg-pink-500 px-1.5 text-[10px] font-bold text-white">{unread[swap._id]}</span>}
                  </div>
                  <div className="text-xs text-slate-300">{swap.offeredSkill} to {swap.wantedSkill}</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      <section className="flex min-h-[72vh] flex-col bg-slate-950/20">
        {active ? (
          <>
            <div className="border-b border-cyan-200/10 bg-white/[0.03] p-4 font-semibold text-white">
              {otherPerson(active)?.name || "Chat"}
              {typingUsers[active._id] && <span className="ml-3 text-xs font-normal text-cyan-200">typing...</span>}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message) => {
                const senderId = message.sender?._id || message.sender;
                const own = String(senderId) === String(user?._id);
                return (
                  <div key={message._id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-lg border px-3 py-2 text-sm ${own ? "border-cyan-200/20 bg-gradient-to-br from-cyan-500/80 to-violet-500/80 text-white" : "border-white/10 bg-white/[0.07] text-slate-100"}`}>{message.text}</div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-cyan-200/10 bg-white/[0.03] p-3">
              <input className="field" value={text} onChange={(e) => updateText(e.target.value)} placeholder="Type a message" />
              <button className="btn-primary"><Send size={17} /></button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-slate-300">Accept a swap request to unlock chat.</div>
        )}
      </section>
    </div>
  );
}
