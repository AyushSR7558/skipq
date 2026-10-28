import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";

export default function CanteenMenu() {
  const { id } = useParams();
  const nav = useNavigate();
  const [menu, setMenu] = useState([]);
  const [favorites, setFavorites] = useState([]);
  
  // Customization Modal State
  const [customItem, setCustomItem] = useState(null);
  const [selectedCustoms, setSelectedCustoms] = useState([]);
  const [customTotal, setCustomTotal] = useState(0);

  // Cart State
  const [cart, setCart] = useState(() =>
    JSON.parse(localStorage.getItem("skipq_cart") || "{}")
  );

  useEffect(() => {
    // Fetch Menu
    api.get(`/menu/canteen/${id}`).then((r) => setMenu(r.data));
    // Fetch Favorites
    api.get(`/features/favorites`).then((r) => setFavorites(r.data.map(f => f.menu_item_id)));
  }, [id]);

  useEffect(() => {
    localStorage.setItem("skipq_cart", JSON.stringify(cart));
  }, [cart]);

  // --- CART LOGIC ---
  const add = (item, extras = [], extraPrice = 0) => {
    // We create a unique key based on item ID + selected extras so the cart separates them
    const uniqueKey = `${item.id}-${extras.map(e => e.id).sort().join("-")}`;
    
    setCart((c) => ({
      ...c,
      [uniqueKey]: { 
        item, 
        qty: (c[uniqueKey]?.qty ?? 0) + 1,
        extras,
        finalPrice: Number(item.price) + extraPrice
      }
    }));
  };

  const remove = (uniqueKey) => {
    setCart((c) => {
      const next = { ...c };
      if (!next[uniqueKey]) return c;
      next[uniqueKey].qty -= 1;
      if (next[uniqueKey].qty <= 0) delete next[uniqueKey];
      return next;
    });
  };

  const total = Object.values(cart).reduce(
    (s, { finalPrice, qty }) => s + finalPrice * qty,
    0
  );

  const checkout = () => {
    const items = Object.values(cart).map(({ item, qty, extras }) => ({
      menuItemId: item.id,
      quantity: qty,
      customizations: extras.map(e => e.id) // Pass customizations to backend
    }));
    if (!items.length) return;
    localStorage.setItem("skipq_checkout", JSON.stringify({ canteenId: Number(id), items }));
    nav("/checkout");
  };

  // --- FAVORITES LOGIC ---
  const toggleFavorite = async (itemId) => {
    if (favorites.includes(itemId)) {
      await api.delete(`/features/favorites/${itemId}`);
      setFavorites(favorites.filter(id => id !== itemId));
    } else {
      await api.post(`/features/favorites/${itemId}`);
      setFavorites([...favorites, itemId]);
    }
  };

  // --- CUSTOMIZATION LOGIC ---
  const handleAddClick = async (item) => {
    // We need to fetch the customizations for this specific item
    try {
      const { data } = await api.get(`/menu/item/${item.id}`);
      if (data.customizations && data.customizations.length > 0) {
        setCustomItem(data);
        setSelectedCustoms([]);
        setCustomTotal(Number(data.price));
      } else {
        add(item); // No customizations, add directly
      }
    } catch (e) {
      add(item); // Fallback
    }
  };

  const toggleCustom = (custom) => {
    let newSelected;
    if (selectedCustoms.find(c => c.id === custom.id)) {
      newSelected = selectedCustoms.filter(c => c.id !== custom.id);
      setCustomTotal(prev => prev - Number(custom.extra_price));
    } else {
      newSelected = [...selectedCustoms, custom];
      setCustomTotal(prev => prev + Number(custom.extra_price));
    }
    setSelectedCustoms(newSelected);
  };

  const confirmCustomAdd = () => {
    add(customItem, selectedCustoms, customTotal - Number(customItem.price));
    setCustomItem(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold mb-4">Menu</h1>
        {menu.map((m) => (
          <div key={m.id} className="border p-3 rounded mb-2 flex justify-between bg-white shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                {/* E. Dietary Tag */}
                <span className={`w-4 h-4 flex items-center justify-center border rounded-sm ${m.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                  <span className={`w-2 h-2 rounded-full ${m.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                </span>
                
                <div className="font-semibold text-lg">{m.name}</div>
                
                {/* C. Favorite Button */}
                <button 
                  onClick={() => toggleFavorite(m.id)} 
                  className={`text-xl ml-2 ${favorites.includes(m.id) ? 'text-red-500' : 'text-gray-300'}`}
                >
                  ♥
                </button>
              </div>
              
              <div className="text-sm text-gray-600">{m.description}</div>
              <div className="text-sm font-bold mt-1">₹{m.price} · {m.prep_time_min} min</div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddClick(m)}
                className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded font-bold"
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>

      <aside className="border p-4 rounded h-fit bg-white shadow-sm sticky top-6">
        <h2 className="font-bold mb-2">Cart</h2>
        {Object.values(cart).length === 0 && <p className="text-sm text-gray-500">Empty</p>}
        
        {Object.entries(cart).map(([key, { item, qty, extras, finalPrice }]) => (
          <div key={key} className="mb-3 border-b pb-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>{item.name} × {qty}</span>
              <span>₹{finalPrice * qty}</span>
            </div>
            {extras.length > 0 && (
              <div className="text-xs text-gray-500">
                + {extras.map(e => e.name).join(", ")}
              </div>
            )}
            <div className="flex gap-2 mt-1">
              <button onClick={() => remove(key)} className="px-2 border rounded text-xs">−</button>
              <button onClick={() => add(item, extras, finalPrice - Number(item.price))} className="px-2 border rounded text-xs">+</button>
            </div>
          </div>
        ))}
        
        <hr className="my-2" />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span><span>₹{total}</span>
        </div>
        <button
          onClick={checkout}
          disabled={!Object.keys(cart).length}
          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white p-2 rounded disabled:opacity-50 font-bold"
        >
          Checkout
        </button>
      </aside>

      {/* CUSTOMIZATION MODAL */}
      {customItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 max-w-full">
            <h2 className="text-xl font-bold mb-2">Customize {customItem.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Select your add-ons</p>
            
            <div className="space-y-2 mb-4">
              {customItem.customizations.map(c => (
                <label key={c.id} className="flex items-center justify-between border p-2 rounded cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={selectedCustoms.some(sc => sc.id === c.id)}
                      onChange={() => toggleCustom(c)}
                      className="w-4 h-4"
                    />
                    <span>{c.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">+₹{c.extra_price}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between font-bold mb-4">
              <span>Total:</span>
              <span>₹{customTotal}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setCustomItem(null)} className="flex-1 border p-2 rounded hover:bg-gray-100">Cancel</button>
              <button onClick={confirmCustomAdd} className="flex-1 bg-orange-500 text-white p-2 rounded hover:bg-orange-600">Add to Cart</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
