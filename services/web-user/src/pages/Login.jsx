import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(form.email, form.password);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">Student Login</h1>
      {err && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="w-full border p-2 rounded"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="w-full bg-orange-500 text-white p-2 rounded">Login</button>
      </form>
      <p className="text-sm mt-3">
        New here? <Link to="/register" className="text-orange-600">Register</Link>
      </p>
    </div>
  );
}
