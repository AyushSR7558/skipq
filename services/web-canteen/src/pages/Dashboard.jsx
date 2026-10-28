import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get("/orders/canteen").then((r) => setOrders(r.data));
  }, []);

  const stats = {
    total: orders.length,
    placed: orders.filter((o) => o.status === "PLACED").length,
    preparing: orders.filter((o) => o.status === "PREPARING").length,
    ready: orders.filter((o) => o.status === "READY").length,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-4 gap-4">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="border rounded p-4 bg-white">
            <div className="text-sm text-gray-500">{k.toUpperCase()}</div>
            <div className="text-3xl font-bold">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
