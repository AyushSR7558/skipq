import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function Notifications() {
  const [list, setList] = useState([]);

  const load = () => api.get("/notifications").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    load();
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      {list.length === 0 && <p className="text-gray-500">Nothing here yet.</p>}
      {list.map((n) => (
        <div
          key={n.id}
          className={`border rounded p-3 mb-2 ${n.is_read ? "opacity-60" : ""}`}
        >
          <div className="flex justify-between">
            <span className="font-semibold">{n.title}</span>
            <span className="text-xs text-gray-500">
              {new Date(n.created_at).toLocaleString()}
            </span>
          </div>
          <p className="text-sm">{n.message}</p>
          {!n.is_read && (
            <button
              onClick={() => markRead(n.id)}
              className="text-xs text-orange-600 mt-1"
            >
              Mark as read
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
