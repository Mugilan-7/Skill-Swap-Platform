import { useEffect, useMemo, useState } from "react";
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
    if (!active) return;
    setError("");

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
      if (String(message.swap) !== String(active._id)) return;
      setMessages((prev) => (prev.some((item) => item._id === message._id) ? prev : [...prev, message]));
    };
    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
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
  }

  return (
    <div className="grid min-h-[72vh] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[320px_1fr]">
      <aside className="border-b border-slate-200 dark:border-slate-800 md:border-b-0 md:border-r">
        <div className="border-b border-slate-200 p-4 font-semibold dark:border-slate-800">Accepted chats</div>
        {error && <div className="m-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {swaps.map((swap) => {
            const person = otherPerson(swap);
            if (!person) return null;
            return (
              <button key={swap._id} onClick={() => setActive(swap)} className={`flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${active?._id === swap._id ? "bg-teal-50 dark:bg-teal-950" : ""}`}>
                <img className="h-10 w-10 rounded-full object-cover" src={person.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${person.name}`} alt="" />
                <div>
                  <div className="font-semibold">{person.name}</div>
                  <div className="text-xs text-slate-500">{swap.offeredSkill} to {swap.wantedSkill}</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      <section className="flex min-h-[72vh] flex-col bg-slate-50 dark:bg-slate-950">
        {active ? (
          <>
            <div className="border-b border-slate-200 bg-white p-4 font-semibold dark:border-slate-800 dark:bg-slate-900">{otherPerson(active)?.name || "Chat"}</div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message) => {
                const senderId = message.sender?._id || message.sender;
                const own = String(senderId) === String(user?._id);
                return (
                  <div key={message._id} className={`flex ${own ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-lg px-3 py-2 text-sm ${own ? "bg-teal-700 text-white" : "bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>{message.text}</div>
                  </div>
                );
              })}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <input className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" />
              <button className="btn-primary"><Send size={17} /></button>
            </form>
          </>
        ) : (
          <div className="grid flex-1 place-items-center text-slate-500">Accept a swap request to unlock chat.</div>
        )}
      </section>
    </div>
  );
}
