import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { logout } = useAuth();
  const nav = useNavigate();
  return (
    <aside className="w-56 bg-gray-900 text-white min-h-screen p-4 flex flex-col gap-3">
      <h1 className="text-xl font-bold mb-4">SkipQ Staff</h1>
      <Link to="/">Dashboard</Link>
      <Link to="/orders">Live Orders</Link>
      <Link to="/menu">Menu Manager</Link>
      <button
        onClick={() => { logout(); nav("/login"); }}
        className="mt-auto bg-red-600 p-2 rounded"
      >
        Logout
      </button>
    </aside>
  );
}
