import { Bot, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { sendAiMessage } from "../lib/ai.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([{ role: "bot", text: "Ask me for skill ideas, profile tips, or partner matches." }]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, open]);

  if (!user) return null;

  async function ask(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    const question = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);
    try {
      const reply = await sendAiMessage(question);
      setMessages((prev) => [...prev, { role: "bot", text: reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: error.message || "AI service is temporarily unavailable. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="panel mb-3 flex h-[460px] w-[min(92vw,380px)] flex-col shadow-[0_0_60px_rgba(34,211,238,0.18)]">
          <div className="flex items-center justify-between border-b border-cyan-200/10 px-4 py-3">
            <div className="flex items-center gap-3 font-semibold text-white">
              <span className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 via-violet-500 to-pink-400 shadow-[0_0_30px_rgba(34,211,238,0.35)] ${loading ? "animate-pulse" : ""}`}><Bot size={18} /></span>
              <span>
                <span className="block leading-tight">Skill Coach</span>
                <span className="text-xs font-normal text-cyan-100/70">AI workspace assistant</span>
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-lg border border-cyan-200/10 bg-white/5 p-1 text-slate-300 transition hover:border-pink-300/40 hover:text-pink-100" title="Close"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.map((message, index) => (
              <div key={index} className={`rounded-lg border px-3 py-2 shadow-[0_0_24px_rgba(0,0,0,0.12)] ${message.role === "user" ? "ml-8 border-cyan-200/20 bg-gradient-to-br from-cyan-500/80 to-violet-500/80 text-white" : "mr-8 border-white/10 bg-white/[0.07] text-slate-100"}`}>
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="mr-8 flex items-center gap-2 rounded-lg border border-cyan-200/10 bg-white/[0.07] px-3 py-2 text-cyan-100">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-violet-300 [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-pulse rounded-full bg-pink-300 [animation-delay:240ms]" />
                <span className="ml-1">Streaming response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={ask} className="flex gap-2 border-t border-cyan-200/10 p-3">
            <input className="field" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask for suggestions..." disabled={loading} />
            <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" title="Send" disabled={loading || !prompt.trim()}>
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send size={17} />}
            </button>
          </form>
        </motion.div>
      )}
      <button onClick={() => setOpen(!open)} className="grid h-14 w-14 place-items-center rounded-lg bg-gradient-to-br from-cyan-300 via-violet-500 to-pink-400 text-white shadow-[0_0_42px_rgba(34,211,238,0.35)] transition hover:-translate-y-1 hover:shadow-[0_0_56px_rgba(244,114,182,0.35)]" title="AI chatbot">
        <Bot size={24} />
      </button>
    </div>
  );
}
