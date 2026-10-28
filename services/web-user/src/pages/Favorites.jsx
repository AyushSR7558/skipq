import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const nav = useNavigate();

  useEffect(() => {
    api.get("/features/favorites").then((r) => setFavorites(r.data));
  }, []);

  const removeFav = async (id) => {
    await api.delete(`/features/favorites/${id}`);
    setFavorites(favorites.filter((f) => f.menu_item_id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Favorites ♥</h1>
      
      {favorites.length === 0 && (
        <p className="text-gray-500">
          You haven't added any favorites yet. Go to a canteen menu and click the heart icon!
        </p>
      )}

      <div className="grid gap-4">
        {favorites.map((f) => (
          <div key={f.id} className="border p-4 rounded bg-white shadow-sm flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">{f.name}</div>
              <div className="text-gray-600">₹{f.price}</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => removeFav(f.menu_item_id)}
                className="text-red-500 border border-red-500 px-3 py-1 rounded hover:bg-red-50"
              >
                Remove
              </button>
              <button
                onClick={() => nav(`/canteen/${f.canteen_id}`)}
                className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600"
              >
                Go to Canteen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
