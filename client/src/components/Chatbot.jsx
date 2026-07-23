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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex h-[460px] w-[min(92vw,360px)] flex-col rounded-lg border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2 font-semibold"><Bot size={18} /> Skill Coach</div>
            <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800" title="Close"><X size={18} /></button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            {messages.map((message, index) => (
              <div key={index} className={`rounded-lg px-3 py-2 ${message.role === "user" ? "ml-8 bg-teal-700 text-white" : "mr-8 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>
                {message.text}
              </div>
            ))}
            {loading && (
              <div className="mr-8 flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-slate-600 dark:bg-slate-800">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700" />
                <span>Typing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={ask} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
            <input className="field" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask for suggestions..." disabled={loading} />
            <button className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" title="Send" disabled={loading || !prompt.trim()}>
              {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Send size={17} />}
            </button>
          </form>
        </motion.div>
      )}
      <button onClick={() => setOpen(!open)} className="grid h-14 w-14 place-items-center rounded-full bg-teal-700 text-white shadow-soft transition hover:bg-teal-800" title="AI chatbot">
        <Bot size={24} />
      </button>
    </div>
  );
}
