import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function MenuManager() {
  const [items, setItems] = useState([]);
  
  // Form State
  const [form, setForm] = useState({ 
    name: "", price: "", description: "", prepTimeMin: 10, categoryId: 1, isVeg: true 
  });
  
  // Customizations State
  const [customs, setCustoms] = useState([]);

  const load = () => api.get("/menu/my-canteen").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  // --- CUSTOMIZATION HANDLERS ---
  const addCustomField = () => setCustoms([...customs, { name: "", extraPrice: 0 }]);
  
  const updateCustom = (index, field, value) => {
    const newCustoms = [...customs];
    newCustoms[index][field] = value;
    setCustoms(newCustoms);
  };
  
  const removeCustom = (index) => setCustoms(customs.filter((_, i) => i !== index));

  // --- SUBMIT FORM ---
  const addItem = async (e) => {
    e.preventDefault();
    try {
      await api.post("/menu", {
        ...form,
        price: Number(form.price),
        prepTimeMin: Number(form.prepTimeMin),
        customizations: customs, // Send to backend
      });
      // Reset form
      setForm({ name: "", price: "", description: "", prepTimeMin: 10, categoryId: 1, isVeg: true });
      setCustoms([]);
      load();
    } catch (err) {
      alert("Failed to add item: " + (err.response?.data?.message || err.message));
    }
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
      
      {/* ADD ITEM FORM */}
      <form onSubmit={addItem} className="bg-white p-4 rounded border mb-6 grid grid-cols-2 gap-4">
        <input required className="border p-2 rounded" placeholder="Item Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        <input required type="number" className="border p-2 rounded" placeholder="Price (₹)" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
        <input className="border p-2 rounded" placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        <input required type="number" className="border p-2 rounded" placeholder="Prep Time (mins)" value={form.prepTimeMin} onChange={e => setForm({...form, prepTimeMin: e.target.value})} />
        
        <select className="border p-2 rounded" value={form.categoryId} onChange={e => setForm({...form, categoryId: Number(e.target.value)})}>
          <option value={1}>Snacks</option>
          <option value={2}>Meals</option>
          <option value={3}>Beverages</option>
        </select>

        {/* VEG TOGGLE */}
        <label className="flex items-center gap-2 border p-2 rounded cursor-pointer">
          <input type="checkbox" checked={form.isVeg} onChange={e => setForm({...form, isVeg: e.target.checked})} />
          Is Vegetarian?
        </label>

        {/* CUSTOMIZATIONS SECTION */}
        <div className="col-span-2 border p-3 rounded bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Add-ons / Customizations</h3>
            <button type="button" onClick={addCustomField} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">
              + Add Option
            </button>
          </div>
          {customs.length === 0 && <p className="text-sm text-gray-500">No add-ons yet.</p>}
          {customs.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input placeholder="Option Name (e.g. Extra Cheese)" className="border p-2 rounded flex-1" value={c.name} onChange={(e) => updateCustom(i, 'name', e.target.value)} />
              <input type="number" placeholder="Extra Price" className="border p-2 rounded w-32" value={c.extraPrice} onChange={(e) => updateCustom(i, 'extraPrice', Number(e.target.value))} />
              <button type="button" onClick={() => removeCustom(i)} className="text-red-500 px-2">✕</button>
            </div>
          ))}
        </div>

        <button className="bg-green-600 text-white p-2 rounded col-span-2 font-bold">Add Item to Menu</button>
      </form>

      {/* MENU LIST */}
      <div className="grid md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className={`border p-4 rounded bg-white ${!item.is_available ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
              <div className="font-bold text-lg">{item.name}</div>
            </div>
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
