import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", price: "", description: "", prepTimeMin: 10, categoryId: 1 });

  const load = () => api.get("/menu/my-canteen").then((r) => setItems(r.data));
  
  useEffect(() => { load(); }, []);

  const addItem = async (e) => {
    e.preventDefault();
    await api.post("/menu", {
      ...form,
      price: Number(form.price),
      prepTimeMin: Number(form.prepTimeMin),
    });
    setForm({ name: "", price: "", description: "", prepTimeMin: 10, categoryId: 1 });
    load();
  };

  const toggleAvailable = async (item) => {
    await api.patch(`/menu/${item.id}`, { is_available: item.is_available ? 0 : 1 });
    load();
  };

  const removeItem = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await api.delete(`/menu/${id}`);
      load();
    } catch (e) {
      alert(e.response?.data?.message || "Cannot delete");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Menu Manager</h1>
      
      {/* Add Item Form */}
      <form onSubmit={addItem} className="bg-white p-4 rounded border mb-6 grid grid-cols-2 gap-4">
        <input required className="border p-2 rounded" placeholder="Item Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input required type="number" className="border p-2 rounded" placeholder="Price (₹)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
        <input className="border p-2 rounded" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <input required type="number" className="border p-2 rounded" placeholder="Prep Time (mins)" value={form.prepTimeMin} onChange={e => setForm({...form, prepTimeMin: e.target.value})} />
        
        {/* Hardcoded to 1 for demo, ideally fetch categories from API */}
        <select className="border p-2 rounded" value={form.categoryId} onChange={e => setForm({...form, categoryId: Number(e.target.value)})}>
          <option value={1}>Snacks</option>
          <option value={2}>Meals</option>
          <option value={3}>Beverages</option>
        </select>
        
        <button className="bg-green-600 text-white p-2 rounded col-span-2">Add Item to Menu</button>
      </form>

      {/* Menu List */}
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className={`border p-4 rounded bg-white ${!item.is_available ? 'opacity-50' : ''}`}>
            <div className="font-bold text-lg">{item.name}</div>
            <div className="text-gray-600 text-sm mb-2">{item.description}</div>
            <div className="font-bold">₹{item.price}</div>
            
            <div className="flex gap-2 mt-4 text-sm">
              <button onClick={() => toggleAvailable(item)} className="border px-2 py-1 rounded">
                {item.is_available ? "Mark Unavailable" : "Mark Available"}
              </button>
              <button onClick={() => removeItem(item.id)} className="text-red-600 border border-red-600 px-2 py-1 rounded">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
