import { useEffect, useState } from "react";
import api from "../lib/api.js";
import UserCard from "../components/UserCard.jsx";

const categories = ["", "coding", "design", "music", "language", "business", "fitness"];

export default function Browse() {
  const [users, setUsers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [filters, setFilters] = useState({ search: "", category: "" });
  const [requestUser, setRequestUser] = useState(null);
  const [form, setForm] = useState({ offeredSkill: "", wantedSkill: "", message: "" });

  async function load() {
    const params = new URLSearchParams(filters);
    const [usersRes, recRes] = await Promise.all([api.get(`/users?${params}`), api.get("/users/recommendations")]);
    setUsers(usersRes.data);
    setRecommended(recRes.data);
  }

  useEffect(() => {
    load().catch(() => {});
  }, [filters.category]);

  async function submitRequest(e) {
    e.preventDefault();
    await api.post("/swaps", { ...form, to: requestUser._id });
    setRequestUser(null);
    setForm({ offeredSkill: "", wantedSkill: "", message: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-bold">Browse people</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Search by offered or wanted skills.</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <input className="field min-w-0 md:w-72" placeholder="Search skills" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className="field w-36" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            {categories.map((category) => <option key={category} value={category}>{category || "All"}</option>)}
          </select>
          <button className="btn-primary">Search</button>
        </form>
      </div>
      {recommended.length > 0 && (
        <section className="panel p-5">
          <h2 className="font-semibold">Recommended partners</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {recommended.map(({ user }) => <UserCard key={user._id} user={user} onRequest={setRequestUser} />)}
          </div>
        </section>
      )}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => <UserCard key={user._id} user={user} onRequest={setRequestUser} />)}
      </section>
      {requestUser && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 px-4">
          <form onSubmit={submitRequest} className="panel w-full max-w-md p-5">
            <h2 className="text-lg font-semibold">Request swap with {requestUser.name}</h2>
            <div className="mt-4 space-y-3">
              <input className="field" placeholder="Skill you will teach" value={form.offeredSkill} onChange={(e) => setForm({ ...form, offeredSkill: e.target.value })} />
              <input className="field" placeholder="Skill you want to learn" value={form.wantedSkill} onChange={(e) => setForm({ ...form, wantedSkill: e.target.value })} />
              <textarea className="field min-h-24" placeholder="Short message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setRequestUser(null)} className="btn-secondary">Cancel</button>
              <button className="btn-primary">Send request</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
