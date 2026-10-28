import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/axios";
import { io } from "socket.io-client";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const load = () =>
      api.get("/notifications").then((r) =>
        setUnread(r.data.filter((n) => !n.is_read).length)
      );
    load();

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: localStorage.getItem("skipq_token") },
    });
    socket.on("order:status", () => setUnread((u) => u + 1));

    return () => socket.disconnect();
  }, [user]);

  return (
    <nav className="flex items-center justify-between p-4 bg-orange-500 text-white">
      <Link to="/" className="font-bold text-xl">SkipQ</Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <Link to="/orders">My Orders</Link>
            <Link to="/favorites">Favorites ♥</Link> 
            <Link to="/notifications" className="relative">
              🔔
              {unread > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-600 text-xs px-1 rounded-full">
                  {unread}
                </span>
              )}
            </Link>
            <span className="text-sm">Hi, {user.name}</span>
            <button
              onClick={() => { logout(); nav("/login"); }}
              className="bg-white text-orange-600 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
