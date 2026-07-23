import { useState } from "react";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import SkillPill from "../components/SkillPill.jsx";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || "",
    bio: user?.bio || "",
    category: user?.category || "coding",
    skillsOffered: user?.skillsOffered?.join(", ") || "",
    skillsWanted: user?.skillsWanted?.join(", ") || ""
  });
  const [file, setFile] = useState(null);
  const [saved, setSaved] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value));
    if (file) payload.append("profilePicture", file);
    const { data } = await api.put("/users/me", payload);
    setUser(data);
    localStorage.setItem("skillswap_user", JSON.stringify(data));
    setSaved(true);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <aside className="panel tilt-card p-6">
        <img className="h-28 w-28 rounded-lg border border-cyan-200/25 object-cover shadow-[0_0_40px_rgba(34,211,238,0.2)]" src={user?.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}`} alt="" />
        <h1 className="mt-4 bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-2xl font-bold text-transparent">{user?.name}</h1>
        <p className="text-slate-300">{user?.email}</p>
        <div className="mt-4 flex flex-wrap gap-2">{user?.badges?.map((badge) => <SkillPill key={badge}>{badge}</SkillPill>)}</div>
        <div className="mt-5 flex items-center gap-5 rounded-lg border border-cyan-200/10 bg-white/[0.04] p-4">
          <div className="progress-ring" style={{ "--value": `${Math.min(360, ((user?.ratingAverage || 0) / 5) * 360)}deg` }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{user?.ratingAverage || 0}</div>
              <div className="text-xs text-cyan-100">/5</div>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-300">Reputation score</div>
            <div className="mt-1 text-sm text-cyan-100">{user?.ratingCount || 0} completed ratings</div>
          </div>
        </div>
      </aside>
      <form onSubmit={submit} className="panel p-6">
        <h2 className="text-xl font-semibold text-white">Edit profile</h2>
        {saved && <div className="mt-4 rounded-lg border border-cyan-200/20 bg-cyan-400/10 p-3 text-sm text-cyan-100">Profile updated.</div>}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <textarea className="field min-h-28 md:col-span-2" placeholder="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          <input className="field md:col-span-2" value={form.skillsOffered} onChange={(e) => setForm({ ...form, skillsOffered: e.target.value })} />
          <input className="field md:col-span-2" value={form.skillsWanted} onChange={(e) => setForm({ ...form, skillsWanted: e.target.value })} />
          <input className="field md:col-span-2" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button className="btn-primary mt-5">Save profile</button>
      </form>
    </div>
  );
}
