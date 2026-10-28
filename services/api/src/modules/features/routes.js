import { Router } from "express";
import { q } from "../../config/db.js";
import { auth, requireRole } from "../../middleware/auth.js";

const router = Router();

// --- C. FAVORITES ---
router.get("/favorites", auth, requireRole("USER"), async (req, res, next) => {
  try {
    const [rows] = await q(
      `SELECT f.id, f.menu_item_id, m.name, m.price, m.canteen_id
       FROM favorites f
       JOIN menu_items m ON m.id = f.menu_item_id
       WHERE f.user_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.post("/favorites/:menuItemId", auth, requireRole("USER"), async (req, res, next) => {
  try {
    await q(`INSERT IGNORE INTO favorites (user_id, menu_item_id) VALUES (?, ?)`, [req.user.id, req.params.menuItemId]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/favorites/:menuItemId", auth, requireRole("USER"), async (req, res, next) => {
  try {
    await q(`DELETE FROM favorites WHERE user_id = ? AND menu_item_id = ?`, [req.user.id, req.params.menuItemId]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// --- B. REVIEWS (Placeholder for later) ---
router.post("/reviews", auth, requireRole("USER"), async (req, res, next) => {
  try {
    const { canteenId, menuItemId, rating, comment } = req.body;

    // 1. VERIFICATION CHECK: Did this user actually order this item?
    // If menuItemId is provided (reviewing a specific dish), we check the order history.
    if (menuItemId) {
      const [orders] = await q(
        `SELECT o.id FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = ? 
           AND oi.menu_item_id = ? 
           AND o.status = 'PICKED_UP' 
         LIMIT 1`,
        [req.user.id, menuItemId]
      );

      // If no completed order is found, block the review.
      if (!orders.length) {
        return res.status(403).json({ 
          message: "You can only review items you have successfully ordered and picked up." 
        });
      }
    }

    // 2. If verification passes, insert the review
    await q(
      `INSERT INTO reviews (user_id, canteen_id, menu_item_id, rating, comment) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, canteenId, menuItemId || null, rating, comment]
    );

    // 3. Update canteen average rating
    const [avg] = await q(`SELECT AVG(rating) as avg_rating FROM reviews WHERE canteen_id = ?`, [canteenId]);
    await q(`UPDATE canteens SET average_rating = ? WHERE id = ?`, [avg[0].avg_rating || 0, canteenId]);

    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

router.get("/reviews/canteen/:canteenId", async (req, res, next) => {
  try {
    const [rows] = await q(
      `SELECT r.*, u.name as user_name FROM reviews r 
       JOIN users u ON u.id = r.user_id WHERE r.canteen_id = ? ORDER BY r.created_at DESC`, 
      [req.params.canteenId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get("/reviews/menu-item/:menuItemId", auth, async (req, res, next) => {
  try {
    // 1. Fetch reviews
    const [rows] = await q(
      `SELECT r.rating, r.comment, r.created_at, u.name as user_name 
       FROM reviews r JOIN users u ON u.id = r.user_id 
       WHERE r.menu_item_id = ? ORDER BY r.created_at DESC`, 
      [req.params.menuItemId]
    );

    // 2. Check if user ordered this
    const [orders] = await q(
      `SELECT o.id FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = ? AND oi.menu_item_id = ? AND o.status = 'PICKED_UP' 
       LIMIT 1`,
      [req.user.id, req.params.menuItemId]
    );

    res.json({ 
      reviews: rows || [], // <-- Ensure it always sends an array
      canReview: orders.length > 0 
    });
  } catch (e) { next(e); }
});

export default router;
