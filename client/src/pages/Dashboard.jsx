import { useEffect, useState } from "react";
import { Check, Clock, Star, Users, X } from "lucide-react";
import api from "../lib/api.js";

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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Track requests, accepted swaps, and skill demand.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="panel p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{label}</span>
              <Icon className="text-teal-700" size={20} />
            </div>
            <div className="mt-3 text-3xl font-bold">{value}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="panel p-5">
          <h2 className="font-semibold">Received requests</h2>
          <div className="mt-4 space-y-3">
            {swaps.received.filter((swap) => swap.status === "pending").map((swap) => (
              <div key={swap._id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
                <div className="font-semibold">{swap.from.name}</div>
                <p className="text-sm text-slate-500">Offers {swap.offeredSkill} for {swap.wantedSkill}</p>
                <p className="mt-2 text-sm">{swap.message}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => updateStatus(swap._id, "accepted")} className="btn-primary"><Check size={16} /> Accept</button>
                  <button onClick={() => updateStatus(swap._id, "rejected")} className="btn-secondary"><X size={16} /> Reject</button>
                </div>
              </div>
            ))}
            {swaps.received.filter((swap) => swap.status === "pending").length === 0 && <p className="text-sm text-slate-500">No pending received requests.</p>}
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-semibold">Trending skills</h2>
          <div className="mt-4 space-y-3">
            {data.trendingSkills.map((skill) => (
              <div key={skill.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <span className="font-medium capitalize">{skill.name}</span>
                <span className="text-sm text-slate-500">{skill.count} mentors</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="panel p-5">
        <h2 className="font-semibold">Accepted swaps</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {swaps.accepted.map((swap) => (
            <div key={swap._id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="font-semibold">{swap.from.name} ↔ {swap.to.name}</div>
              <p className="text-sm text-slate-500">{swap.offeredSkill} for {swap.wantedSkill}</p>
              <button onClick={() => updateStatus(swap._id, "completed")} className="btn-secondary mt-3">Mark completed</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
