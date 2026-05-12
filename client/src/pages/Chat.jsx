import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { io } from "socket.io-client";
import api, { SOCKET_URL } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Chat() {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const socket = useMemo(() => io(SOCKET_URL, { auth: { token: localStorage.getItem("skillswap_token") } }), []);

  useEffect(() => {
    api.get("/swaps").then((res) => {
      setSwaps(res.data.accepted);
      if (res.data.accepted[0]) setActive(res.data.accepted[0]);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    api.get(`/chats/${active._id}/messages`).then((res) => setMessages(res.data));
    socket.emit("swap:join", active._id);
    const handler = (message) => {
      if (String(message.swap) === String(active._id)) setMessages((prev) => [...prev, message]);
    };
    socket.on("message:new", handler);
    return () => socket.off("message:new", handler);
  }, [active]);

  function otherPerson(swap) {
    return String(swap.from._id) === String(user._id) ? swap.to : swap.from;
  }

  function send(e) {
    e.preventDefault();
    if (!text.trim() || !active) return;
    socket.emit("message:send", { swapId: active._id, text });
    setText("");
  }

  return (
    <div className="grid min-h-[72vh] overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[320px_1fr]">
      <aside className="border-b border-slate-200 dark:border-slate-800 md:border-b-0 md:border-r">
        <div className="border-b border-slate-200 p-4 font-semibold dark:border-slate-800">Accepted chats</div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {swaps.map((swap) => {
            const person = otherPerson(swap);
            return (
              <button key={swap._id} onClick={() => setActive(swap)} className={`flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${active?._id === swap._id ? "bg-teal-50 dark:bg-teal-950" : ""}`}>
                <img className="h-10 w-10 rounded-full object-cover" src={person.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${person.name}`} alt="" />
                <div>
                  <div className="font-semibold">{person.name}</div>
                  <div className="text-xs text-slate-500">{swap.offeredSkill} ↔ {swap.wantedSkill}</div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>
      <section className="flex min-h-[72vh] flex-col bg-slate-50 dark:bg-slate-950">
        {active ? (
          <>
            <div className="border-b border-slate-200 bg-white p-4 font-semibold dark:border-slate-800 dark:bg-slate-900">{otherPerson(active).name}</div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((message) => {
                const own = String(message.sender._id || message.sender) === String(user._id);
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
