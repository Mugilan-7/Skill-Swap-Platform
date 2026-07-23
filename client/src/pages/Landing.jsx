import { Link } from "react-router-dom";
import { ArrowRight, Bot, Code2, Moon, Sparkles, Sun, Zap } from "lucide-react";

export default function Landing({ dark, setDark }) {
  return (
    <div className="landing-shell min-h-screen text-slate-100">
      <div className="code-rain" aria-hidden="true">
        <span>{"match('/react', '/figma')"}</span>
        <span>{"ai.coach({ goal })"}</span>
        <span>{"ship.skills.daily()"}</span>
        <span>{"mentor.rating >= 4.8"}</span>
        <span>{"chat.stream(token)"}</span>
        <span>{"learn(); teach(); repeat();"}</span>
      </div>
      <header className="absolute inset-x-0 top-0 z-20 px-4 py-5">
        <div className="panel mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-400 text-sm text-white shadow-[0_0_30px_rgba(34,211,238,0.35)]">S</span>
            <span className="bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-transparent">SkillSwap Hub</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="btn-secondary px-3" title="Toggle theme">
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <Link className="btn-primary" to="/login">Log in</Link>
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[92vh] max-w-7xl items-center gap-8 px-4 pb-16 pt-32 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="neon-pill mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-1 text-sm">
            <Sparkles size={16} /> AI-powered peer learning network
          </div>
          <h1 className="section-title text-5xl md:text-7xl">SkillSwap Hub</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
            A futuristic workspace for matching mentors, trading skills, and getting AI guidance while you build your next capability.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn-primary">
              Start swapping <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn-secondary">I have an account</Link>
          </div>
        </div>

        <div className="panel tilt-card p-4">
          <div className="mb-4 flex items-center justify-between border-b border-cyan-200/10 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><Code2 size={17} /> skill-match.graph</div>
            <span className="neon-pill rounded-lg px-2 py-1 text-xs">live</span>
          </div>
          <div className="grid gap-3">
            {[
              ["React mentor", "wants Figma systems", "97% fit"],
              ["Python coach", "wants public speaking", "91% fit"],
              ["Music producer", "wants TypeScript", "88% fit"]
            ].map(([name, detail, score]) => (
              <div key={name} className="rounded-lg border border-cyan-200/10 bg-white/[0.04] p-4 transition hover:border-cyan-200/30">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{name}</span>
                  <span className="text-sm text-cyan-100">{score}</span>
                </div>
                <p className="mt-1 text-sm text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-violet-200/10 bg-violet-400/10 p-4">
              <Bot className="text-violet-200" size={22} />
              <p className="mt-3 text-sm text-slate-200">AI coach drafts goals, messages, and learning plans.</p>
            </div>
            <div className="rounded-lg border border-cyan-200/10 bg-cyan-400/10 p-4">
              <Zap className="text-cyan-200" size={22} />
              <p className="mt-3 text-sm text-slate-200">Real-time swaps, chat, badges, and progress tracking.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 md:grid-cols-3">
        {["Match by skills", "Chat after acceptance", "Earn badges"].map((item) => (
          <div key={item} className="panel tilt-card p-5">
            <h2 className="font-semibold text-white">{item}</h2>
            <p className="mt-2 text-sm text-slate-300">A focused workflow for building trust and keeping every exchange useful.</p>
          </div>
        ))}
      </section>
    </div>
  );
}
