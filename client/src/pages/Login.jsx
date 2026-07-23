import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api, { getApiErrorMessage } from "../lib/api.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "Login failed"));
    }
  }

  async function resendVerification() {
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/resend-verification", { email: form.email });
      setMessage(data.message);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not resend verification email"));
    }
  }

  return (
    <div className="auth-shell grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="panel tilt-card w-full max-w-md p-6">
        <h1 className="section-title text-2xl">Welcome back</h1>
        <p className="muted mt-1 text-sm">Log in to manage swaps and messages.</p>
        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        {message && <div className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">{message}</div>}
        <div className="mt-5 space-y-3">
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <button className="btn-primary mt-5 w-full">Log in</button>
        <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm">
          <Link className="font-semibold text-cyan-200" to="/forgot-password">Forgot password?</Link>
          <button type="button" onClick={resendVerification} className="font-semibold text-cyan-200">Resend verification</button>
        </div>
        <p className="mt-4 text-center text-sm text-slate-300">New here? <Link className="font-semibold text-cyan-200" to="/register">Create an account</Link></p>
      </form>
    </div>
  );
}
