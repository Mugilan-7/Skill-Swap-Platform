import { Link } from "react-router-dom";
import { ArrowRight, Moon, Sparkles, Sun } from "lucide-react";

export default function Landing({ dark, setDark }) {
  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5">
          <div className="text-xl font-bold text-white">SkillSwap Hub</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className="rounded-lg bg-white/15 p-2 text-white backdrop-blur hover:bg-white/25" title="Toggle theme">
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <Link className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900" to="/login">Log in</Link>
          </div>
        </div>
      </header>
      <section className="relative min-h-[88vh] overflow-hidden bg-slate-950">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1800&q=80"
          alt="People sharing skills"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-950/60" />
        <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-7xl items-center px-4 pt-20">
          <div className="max-w-3xl text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
              <Sparkles size={16} /> Peer learning, organized.
            </div>
            <h1 className="text-5xl font-bold leading-tight md:text-7xl">SkillSwap Hub</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-100 md:text-xl">
              Find people who can teach what you want to learn, offer your own skills in return, and chat once both sides agree.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary bg-teal-600 hover:bg-teal-700">
                Start swapping <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">I have an account</Link>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-3">
        {["Match by skills", "Chat after acceptance", "Earn badges"].map((item) => (
          <div key={item} className="panel p-5">
            <h2 className="font-semibold">{item}</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A focused workflow for building trust and keeping every exchange useful.</p>
          </div>
        ))}
      </section>
    </div>
  );
}
