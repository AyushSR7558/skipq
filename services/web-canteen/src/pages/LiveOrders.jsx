import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { api } from "../api/axios";

const NEXT = {
  PLACED: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "PICKED_UP",
};
const NEXT_LABEL = {
  PLACED: "Confirm",
  CONFIRMED: "Start preparing",
  PREPARING: "Mark ready",
  READY: "Picked up",
};

export default function LiveOrders() {
  const [orders, setOrders] = useState([]);

  const load = () => api.get("/orders/canteen").then((r) => setOrders(r.data));
  
  useEffect(() => { 
    load(); 
  }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: localStorage.getItem("skipq_token") },
    });
    
    socket.on("order:new", (order) => {
      setOrders((prev) => [order, ...prev]);
      // Play sound if you have ding.mp3 in your public folder:
      // new Audio("/ding.mp3").play().catch(() => {});
    });
    
    return () => socket.disconnect();
  }, []);

  const advance = async (order) => {
    const next = NEXT[order.status];
    if (!next) return;
    await api.patch(`/orders/${order.id}/status`, { status: next });
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: next } : o))
    );
  };

  const cancel = async (order) => {
    if (!window.confirm("Cancel this order?")) return;
    await api.patch(`/orders/${order.id}/status`, { status: "CANCELLED" });
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: "CANCELLED" } : o))
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Live Orders</h1>
        <button onClick={load} className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">
          Refresh
        </button>
      </div>
      
      {orders.length === 0 && <p className="text-gray-500">No orders yet.</p>}
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {orders.map((o) => (
          <div key={o.id} className="border rounded p-4 bg-white shadow-sm">
            <div className="flex justify-between font-semibold border-b pb-2 mb-2">
              <span>Order #{o.id} — {o.user?.name ?? "Student"}</span>
              <span className="text-orange-600 font-bold">{o.status}</span>
            </div>
            
            <ul className="my-2 text-sm space-y-1">
              {o.items.map((it, i) => (
                <li key={i} className="flex justify-between">
                  <span>{it.quantity}× {it.name}</span>
                  <span className="text-gray-500">₹{it.unit_price * it.quantity}</span>
                </li>
              ))}
            </ul>
            
            <div className="font-bold text-lg mt-3 border-t pt-2">
              Total: ₹{o.total_amount}
            </div>
            <div className="text-xs text-gray-500">Pickup Code: <b>{o.pickup_code}</b></div>
            {o.special_instructions && (
              <div className="text-xs text-red-600 mt-1 bg-red-50 p-1 rounded">
                Note: {o.special_instructions}
              </div>
            )}
            
            <div className="flex gap-2 mt-4">
              {NEXT[o.status] && (
                <button
                  onClick={() => advance(o)}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-sm font-medium"
                >
                  {NEXT_LABEL[o.status]}
                </button>
              )}
              {!["PICKED_UP", "CANCELLED"].includes(o.status) && (
                <button
                  onClick={() => cancel(o)}
                  className="text-red-600 border border-red-600 hover:bg-red-50 px-3 py-2 rounded text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
