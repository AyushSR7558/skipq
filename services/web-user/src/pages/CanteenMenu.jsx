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

  // Review Modal State
  const [reviewItem, setReviewItem] = useState(null);
  const [reviews, setReviews] = useState([]); 
  const [canReview, setCanReview] = useState(false); 
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Cart State
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("skipq_cart") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    // Fetch Menu
    api.get(`/menu/canteen/${id}`)
      .then((r) => {
        if (Array.isArray(r.data)) setMenu(r.data);
        else setMenu([]);
      })
      .catch((err) => {
        console.error("Failed to load menu", err);
        setMenu([]);
      });

    // Fetch Favorites
    api.get(`/features/favorites`)
      .then((r) => {
        if (Array.isArray(r.data)) setFavorites(r.data.map(f => f.menu_item_id));
      })
      .catch((err) => console.error("Failed to load favorites", err));
  }, [id]);

  useEffect(() => {
    localStorage.setItem("skipq_cart", JSON.stringify(cart));
  }, [cart]);

  // --- CART LOGIC ---
  const add = (item, extras = [], extraPrice = 0) => {
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

  const total = Object.values(cart || {}).reduce(
    (s, { finalPrice, qty }) => s + (Number(finalPrice) || 0) * (Number(qty) || 0),
    0
  );

  const checkout = () => {
    const items = Object.values(cart || {}).map(({ item, qty, extras }) => ({
      menuItemId: item.id,
      quantity: qty,
      customizations: (extras || []).map(e => e.id)
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
    try {
      const { data } = await api.get(`/menu/item/${item.id}`);
      if (data && Array.isArray(data.customizations) && data.customizations.length > 0) {
        setCustomItem(data);
        setSelectedCustoms([]);
        setCustomTotal(Number(data.price) || 0);
      } else {
        add(item);
      }
    } catch (e) {
      add(item);
    }
  };

  const toggleCustom = (custom) => {
    let newSelected;
    if (selectedCustoms.find(c => c.id === custom.id)) {
      newSelected = selectedCustoms.filter(c => c.id !== custom.id);
      setCustomTotal(prev => prev - Number(custom.extra_price || 0));
    } else {
      newSelected = [...selectedCustoms, custom];
      setCustomTotal(prev => prev + Number(custom.extra_price || 0));
    }
    setSelectedCustoms(newSelected);
  };

  const confirmCustomAdd = () => {
    add(customItem, selectedCustoms, customTotal - Number(customItem.price || 0));
    setCustomItem(null);
  };

  // --- REVIEW LOGIC ---
  const openReviews = async (item) => {
    setReviewItem(item);
    setLoadingReviews(true);
    setReviews([]); 
    try {
      const { data } = await api.get(`/features/reviews/menu-item/${item.id}`);
      
      if (data && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
        setCanReview(data.canReview);
      } else if (Array.isArray(data)) {
        setReviews(data);
        setCanReview(true);
      } else {
        setReviews([]);
        setCanReview(false);
      }
    } catch (e) {
      console.error("Failed to load reviews", e);
      setReviews([]);
      setCanReview(false);
    } finally {
      setLoadingReviews(false);
    }
  };    
    
  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post("/features/reviews", {
        canteenId: Number(id),
        menuItemId: reviewItem.id,
        rating: newReview.rating,
        comment: newReview.comment
      });
      // Reload reviews to show the new one
      const { data } = await api.get(`/features/reviews/menu-item/${reviewItem.id}`);
      if (data && Array.isArray(data.reviews)) {
        setReviews(data.reviews);
      }
      setNewReview({ rating: 5, comment: "" });
      alert("Review submitted successfully!");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to submit review");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold mb-4">Menu</h1>
        {(menu || []).map((m) => (
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
                  className={`text-xl ml-2 ${(favorites || []).includes(m.id) ? 'text-red-500' : 'text-gray-300'}`}
                >
                  ♥
                </button>
              </div>
              
              <div className="text-sm text-gray-600">{m.description}</div>
              <div className="text-sm font-bold mt-1">₹{m.price} · {m.prep_time_min} min</div>
              
              {/* B. See Reviews Button */}
              <button 
                onClick={() => openReviews(m)}
                className="text-xs text-blue-600 hover:underline mt-2 block"
              >
                See Reviews
              </button>
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
        {Object.values(cart || {}).length === 0 && <p className="text-sm text-gray-500">Empty</p>}
        
        {Object.entries(cart || {}).map(([key, { item, qty, extras, finalPrice }]) => (
          <div key={key} className="mb-3 border-b pb-2">
            <div className="flex justify-between text-sm font-semibold">
              <span>{item.name} × {qty}</span>
              <span>₹{finalPrice * qty}</span>
            </div>
            {extras && extras.length > 0 && (
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
          disabled={!Object.keys(cart || {}).length}
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
              {(customItem.customizations || []).map(c => (
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

      {/* REVIEWS MODAL */}
      {reviewItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] max-w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Reviews for {reviewItem.name}</h2>
              <button onClick={() => setReviewItem(null)} className="text-gray-500 hover:text-black text-2xl font-bold">×</button>
            </div>

            {/* EXISTING REVIEWS */}
            <div className="space-y-3 mb-6">
              {loadingReviews ? (
                <p className="text-gray-500 text-sm">Loading reviews...</p>
              ) : (
                Array.isArray(reviews) && reviews.length > 0 ? (
                  reviews.map((r, i) => (
                    <div key={i} className="border-b pb-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">{r.user_name}</span>
                        <span className="text-yellow-500 text-sm">
                          {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this item!</p>
                )
              )}
            </div>

            {/* WRITE REVIEW */}
            {canReview ? (
              <form onSubmit={submitReview} className="border-t pt-4">
                <h3 className="font-bold mb-2">Write a Review</h3>
                <select 
                  className="border p-2 rounded w-full mb-2" 
                  value={newReview.rating} 
                  onChange={e => setNewReview({...newReview, rating: Number(e.target.value)})}
                >
                  <option value={5}>5 Stars - Excellent</option>
                  <option value={4}>4 Stars - Good</option>
                  <option value={3}>3 Stars - Average</option>
                  <option value={2}>2 Stars - Poor</option>
                  <option value={1}>1 Star - Terrible</option>
                </select>
                <textarea 
                  required 
                  className="border p-2 rounded w-full mb-2" 
                  placeholder="What did you think about this dish?" 
                  value={newReview.comment} 
                  onChange={e => setNewReview({...newReview, comment: e.target.value})} 
                />
                <button className="bg-orange-500 hover:bg-orange-600 text-white w-full p-2 rounded font-bold">
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="border-t pt-4 text-center">
                <p className="text-sm text-gray-500 bg-gray-100 p-3 rounded">
                  🔒 You can only review this item after you have ordered it and picked it up from the canteen.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
