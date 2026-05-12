import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const categories = ["coding", "design", "music", "language", "business", "fitness"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", category: "coding", skillsOffered: "", skillsWanted: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const data = await register(form);
      setMessage(data.message || "Account created. Check your email to verify your account.");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-mist px-4 py-8 dark:bg-slate-950">
      <form onSubmit={submit} className="panel w-full max-w-2xl p-6">
        <h1 className="text-2xl font-bold">Create your SkillSwap profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use comma-separated skills for quick setup.</p>
        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        {message && <div className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">{message}</div>}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <input className="field md:col-span-2" placeholder="Skills offered: React, guitar, Figma" value={form.skillsOffered} onChange={(e) => setForm({ ...form, skillsOffered: e.target.value })} />
          <input className="field md:col-span-2" placeholder="Skills wanted: Python, Spanish, photography" value={form.skillsWanted} onChange={(e) => setForm({ ...form, skillsWanted: e.target.value })} />
        </div>
        <button className="btn-primary mt-5 w-full">Create account</button>
        <p className="mt-4 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-teal-700" to="/login">Log in</Link></p>
      </form>
    </div>
  );
}
