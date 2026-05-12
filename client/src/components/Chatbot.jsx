import { Bot, Send, X } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([{ role: "bot", text: "Ask me for skill ideas, profile tips, or partner matches." }]);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  async function ask(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    const question = prompt.trim();
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { prompt: question });
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "bot", text: error.response?.data?.message || "AI assistant is unavailable right now." }]);
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
            {loading && <div className="mr-8 rounded-lg bg-slate-100 px-3 py-2 text-slate-600 dark:bg-slate-800">Thinking...</div>}
          </div>
          <form onSubmit={ask} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
            <input className="field" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask for suggestions..." />
            <button className="btn-primary" title="Send"><Send size={17} /></button>
          </form>
        </motion.div>
      )}
      <button onClick={() => setOpen(!open)} className="grid h-14 w-14 place-items-center rounded-full bg-teal-700 text-white shadow-soft transition hover:bg-teal-800" title="AI chatbot">
        <Bot size={24} />
      </button>
    </div>
  );
}
