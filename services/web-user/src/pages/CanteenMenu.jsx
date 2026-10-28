import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function CanteenMenu() {
  const { id } = useParams();
  const nav = useNavigate();
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("skipq_cart") || "{}")
  );

  useEffect(() => {
    api.get(`/menu/canteen/${id}`).then((r) => setMenu(r.data));
  }, [id]);

  useEffect(() => {
    localStorage.setItem("skipq_cart", JSON.stringify(cart));
  }, [cart]);

  const add = (item) =>
    setCart((c) => ({ ...c, [item.id]: { item, qty: (c[item.id]?.qty ?? 0) + 1 } }));

  const remove = (item) =>
    setCart((c) => {
      const next = { ...c };
      if (!next[item.id]) return c;
      next[item.id].qty -= 1;
      if (next[item.id].qty <= 0) delete next[item.id];
      return next;
    });

  const total = Object.values(cart).reduce(
    (s, { item, qty }) => s + Number(item.price) * qty,
    0
  );

  const checkout = () => {
    const items = Object.values(cart).map(({ item, qty }) => ({
      menuItemId: item.id,
      quantity: qty,
    }));
    if (!items.length) return;
    localStorage.setItem("skipq_checkout", JSON.stringify({ canteenId: Number(id), items }));
    nav("/checkout");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold mb-4">Menu</h1>
        {menu.map((m) => (
          <div key={m.id} className="border p-3 rounded mb-2 flex justify-between">
            <div>
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-gray-600">{m.description}</div>
              <div className="text-sm">₹{m.price} · {m.prep_time_min} min · {m.category_name}</div>
            </div>
            <div className="flex items-center gap-2">
              {cart[m.id] && (
                <>
                  <button onClick={() => remove(m)} className="px-2 border rounded">−</button>
                  <span>{cart[m.id].qty}</span>
                </>
              )}
              <button
                onClick={() => add(m)}
                className="px-2 bg-orange-500 text-white rounded"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <aside className="border p-4 rounded h-fit">
        <h2 className="font-bold mb-2">Cart</h2>
        {Object.values(cart).length === 0 && <p className="text-sm text-gray-500">Empty</p>}
        {Object.values(cart).map(({ item, qty }) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.name} × {qty}</span>
            <span>₹{Number(item.price) * qty}</span>
          </div>
        ))}
        <hr className="my-2" />
        <div className="flex justify-between font-bold">
          <span>Total</span><span>₹{total}</span>
        </div>
        <button
          onClick={checkout}
          disabled={!Object.keys(cart).length}
          className="w-full mt-3 bg-green-600 text-white p-2 rounded disabled:opacity-50"
        >
          Checkout
        </button>
      </aside>
    </div>
  );
}
