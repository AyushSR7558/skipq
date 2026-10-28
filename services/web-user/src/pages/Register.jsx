import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", rollNumber: "" });
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await register(form);
      nav("/");
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">Student Register</h1>
      {err && <div className="bg-red-100 text-red-700 p-2 rounded mb-3">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        {[
          ["name", "Full name"],
          ["email", "Email"],
          ["password", "Password"],
          ["rollNumber", "Roll number"],
        ].map(([k, ph]) => (
          <input
            key={k}
            className="w-full border p-2 rounded"
            placeholder={ph}
            type={k === "password" ? "password" : "text"}
            value={form[k]}
            onChange={(e) => setForm({ ...form, [k]: e.target.value })}
          />
        ))}
        <button className="w-full bg-orange-500 text-white p-2 rounded">Create account</button>
      </form>
      <p className="text-sm mt-3">
        Already have one? <Link to="/login" className="text-orange-600">Login</Link>
      </p>
    </div>
  );
}
