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
      <aside className="panel p-6">
        <img className="h-28 w-28 rounded-full object-cover" src={user?.profilePicture || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.name}`} alt="" />
        <h1 className="mt-4 text-2xl font-bold">{user?.name}</h1>
        <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
        <div className="mt-4 flex flex-wrap gap-2">{user?.badges?.map((badge) => <SkillPill key={badge}>{badge}</SkillPill>)}</div>
        <div className="mt-4 rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
          <div className="text-sm text-slate-500">Rating</div>
          <div className="text-3xl font-bold">{user?.ratingAverage || 0}/5</div>
        </div>
      </aside>
      <form onSubmit={submit} className="panel p-6">
        <h2 className="text-xl font-semibold">Edit profile</h2>
        {saved && <div className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">Profile updated.</div>}
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
