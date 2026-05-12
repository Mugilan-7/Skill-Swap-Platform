import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import api from "../lib/api.js";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not reset password");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-mist px-4 dark:bg-slate-950">
      <form onSubmit={submit} className="panel w-full max-w-md p-6">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        {message && <div className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">{message}</div>}
        {error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</div>}
        <input className="field mt-5" type="password" minLength="6" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary mt-5 w-full">Reset password</button>
        <p className="mt-4 text-center text-sm"><Link className="font-semibold text-teal-700" to="/login">Back to login</Link></p>
      </form>
    </div>
  );
}
