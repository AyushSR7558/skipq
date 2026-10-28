import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";

export default function Home() {
  const [canteens, setCanteens] = useState([]);

  useEffect(() => {
    api.get("/canteens").then((r) => setCanteens(r.data));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Choose a canteen</h1>
      <div className="grid md:grid-cols-2 gap-4">
        {canteens.map((c) => (
          <Link
            key={c.id}
            to={`/canteen/${c.id}`}
            className="border p-4 rounded hover:shadow"
          >
            <div className="flex justify-between">
              <h2 className="font-semibold">{c.name}</h2>
              <span className={c.is_open ? "text-green-600" : "text-red-600"}>
                {c.is_open ? "Open" : "Closed"}
              </span>
            </div>
            <p className="text-sm text-gray-600">{c.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
