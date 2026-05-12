import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api.js";

export default function VerifyEmail() {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, message: "", error: "" });

  useEffect(() => {
    api
      .get(`/auth/verify-email/${token}`)
      .then((res) => setState({ loading: false, message: res.data.message, error: "" }))
      .catch((err) => setState({ loading: false, message: "", error: err.response?.data?.message || "Verification failed" }));
  }, [token]);

  return (
    <div className="grid min-h-screen place-items-center bg-mist px-4 dark:bg-slate-950">
      <div className="panel w-full max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold">Email verification</h1>
        {state.loading && <p className="mt-4 text-slate-500">Verifying...</p>}
        {state.message && <div className="mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800 dark:bg-teal-950 dark:text-teal-200">{state.message}</div>}
        {state.error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{state.error}</div>}
        <Link className="btn-primary mt-5" to="/login">Go to login</Link>
      </div>
    </div>
  );
}
