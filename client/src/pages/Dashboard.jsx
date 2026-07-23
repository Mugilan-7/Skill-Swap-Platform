import { useEffect, useState } from "react";
import { Check, Clock, Star, Users, X } from "lucide-react";
import api from "../lib/api.js";

function CountUp({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(target);
      return undefined;
    }

    let frame;
    const start = performance.now();
    const duration = 850;
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Number((target * eased).toFixed(target % 1 ? 1 : 0)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return display;
}

export default function Dashboard() {
  const [data, setData] = useState({ stats: {}, trendingSkills: [] });
  const [swaps, setSwaps] = useState({ sent: [], received: [], accepted: [], completed: [] });

  async function load() {
    const [dashboardRes, swapsRes] = await Promise.all([api.get("/users/dashboard"), api.get("/swaps")]);
    setData(dashboardRes.data);
    setSwaps(swapsRes.data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  async function updateStatus(id, status) {
    await api.patch(`/swaps/${id}/status`, { status });
    load();
  }

  const cards = [
    { label: "Sent", value: data.stats.sent || 0, icon: Clock },
    { label: "Received", value: data.stats.received || 0, icon: Users },
    { label: "Accepted", value: data.stats.accepted || 0, icon: Check },
    { label: "Rating", value: data.stats.rating || 0, icon: Star }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Dashboard</h1>
        <p className="muted mt-1">Track requests, accepted swaps, and skill demand across your learning workspace.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel tilt-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{label}</span>
              <span className="stat-orb"><Icon size={20} /></span>
            </div>
            <div className="mt-3 text-3xl font-bold text-white"><CountUp value={value} /></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-pink-300" style={{ width: `${Math.min(100, Number(value) * 18 || 12)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="panel p-5">
          <h2 className="font-semibold text-white">Received requests</h2>
          <div className="mt-4 space-y-3">
            {swaps.received.filter((swap) => swap.status === "pending").map((swap) => (
              <div key={swap._id} className="tilt-card rounded-lg border border-cyan-200/15 bg-white/[0.03] p-4">
                <div className="font-semibold text-white">{swap.from.name}</div>
                <p className="text-sm text-slate-300">Offers {swap.offeredSkill} for {swap.wantedSkill}</p>
                <p className="mt-2 text-sm">{swap.message}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => updateStatus(swap._id, "accepted")} className="btn-primary"><Check size={16} /> Accept</button>
                  <button onClick={() => updateStatus(swap._id, "rejected")} className="btn-secondary"><X size={16} /> Reject</button>
                </div>
              </div>
            ))}
            {swaps.received.filter((swap) => swap.status === "pending").length === 0 && <p className="text-sm text-slate-400">No pending received requests.</p>}
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-semibold text-white">Trending skills</h2>
          <div className="mt-4 space-y-3">
            {data.trendingSkills.map((skill) => (
              <div key={skill.name} className="flex items-center justify-between rounded-lg border border-cyan-200/10 bg-white/[0.04] px-3 py-2">
                <span className="font-medium capitalize">{skill.name}</span>
                <span className="text-sm text-cyan-100">{skill.count} mentors</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel p-5">
        <h2 className="font-semibold text-white">Accepted swaps</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {swaps.accepted.map((swap) => (
            <div key={swap._id} className="tilt-card rounded-lg border border-cyan-200/15 bg-white/[0.03] p-4">
              <div className="font-semibold">{swap.from.name} to {swap.to.name}</div>
              <p className="text-sm text-slate-300">{swap.offeredSkill} for {swap.wantedSkill}</p>
              <button onClick={() => updateStatus(swap._id, "completed")} className="btn-secondary mt-3">Mark completed</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
