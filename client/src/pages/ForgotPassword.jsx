import { Link } from "react-router-dom";
import { useState } from "react";
import api from "../lib/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reset link");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-mist px-4 dark:bg-slate-950">
      <form onSubmit={submit} className="panel w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter your email and we will send a secure reset link if the account exists.</p>
        {message && <div className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">{message}</div>}
        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        <input className="field mt-5" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-primary mt-5 w-full">Send reset link</button>
        <p className="mt-4 text-center text-sm"><Link className="font-semibold text-teal-700" to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
