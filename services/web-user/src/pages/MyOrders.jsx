import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../api/axios";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);

  const load = () =>
    api.get("/orders/mine").then((r) => setOrders(r.data));

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: localStorage.getItem("skipq_token") },
    });
    socket.on("order:status", ({ orderId, status, message }) => {
      setToast(message);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      setTimeout(() => setToast(null), 5000);
    });
    return () => socket.disconnect();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white p-3 rounded shadow-lg z-50">
          {toast}
        </div>
      )}
      {orders.length === 0 && <p className="text-gray-500">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="border rounded p-4 mb-3">
          <div className="flex justify-between">
            <span className="font-semibold">#{o.id} — {o.canteen.name}</span>
            <span className="font-mono bg-gray-100 px-2 rounded">{o.status}</span>
          </div>
          <ul className="text-sm my-2">
            {o.items.map((it, idx) => (
              <li key={idx}>{it.quantity}× {it.name}</li>
            ))}
          </ul>
          <div className="text-sm text-gray-600">
            Total ₹{o.total_amount} · Pickup code <b>{o.pickup_code}</b>
          </div>
        </div>
      ))}
    </div>
  );
}
