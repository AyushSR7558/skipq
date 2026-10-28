import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function Checkout() {
  const nav = useNavigate();
  const [data] = useState(() =>
    JSON.parse(localStorage.getItem("skipq_checkout") || "null")
  );
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!data) nav("/");
  }, [data, nav]);

  if (!data) return null;

  const place = async () => {
    try {
      await api.post("/orders", {
        canteenId: data.canteenId,
        items: data.items,
        specialInstructions: notes,
      });
      localStorage.removeItem("skipq_cart");
      localStorage.removeItem("skipq_checkout");
      nav("/orders");
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Confirm order</h1>
      {err && <div className="bg-red-100 text-red-700 p-2 mb-3 rounded">{err}</div>}
      <textarea
        className="w-full border p-2 rounded mb-3"
        placeholder="Special instructions (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button onClick={place} className="w-full bg-orange-500 text-white p-2 rounded">
        Place order
      </button>
    </div>
  );
}
