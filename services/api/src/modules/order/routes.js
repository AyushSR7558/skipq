import { Router } from "express";
import { q, pool } from "../../config/db.js";
import { auth, requireRole } from "../../middleware/auth.js";
import { io } from "../../sockets/index.js";

const router = Router();
router.use(auth);

// USER: place order
router.post("/", requireRole("USER"), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { canteenId, items, specialInstructions } = req.body;
    if (!items?.length) return res.status(400).json({ message: "No items" });

    const ids = items.map((i) => i.menuItemId);
    const [menuRows] = await conn.query(
      `SELECT id, name, price, prep_time_min
       FROM menu_items
       WHERE id IN (?) AND canteen_id = ? AND is_available = 1`,
      [ids, canteenId]
    );
    if (menuRows.length !== ids.length)
      return res.status(400).json({ message: "Some items unavailable or invalid" });

    let total = 0;
    let maxPrep = 0;
    const rowsForInsert = items.map((i) => {
      const mi = menuRows.find((m) => m.id === i.menuItemId);
      total += Number(mi.price) * i.quantity;
      maxPrep = Math.max(maxPrep, mi.prep_time_min);
      return [i.menuItemId, i.quantity, mi.price];
    });

    await conn.beginTransaction();

    const pickupCode = Math.random().toString(36).slice(2, 7).toUpperCase();
    const [orderResult] = await conn.query(
      `INSERT INTO orders
        (user_id, canteen_id, total_amount, pickup_code, special_instructions, estimated_prep_time)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, canteenId, total, pickupCode, specialInstructions ?? null, maxPrep]
    );
    const orderId = orderResult.insertId;

    for (const [menuItemId, quantity, unitPrice] of rowsForInsert) {
      await conn.query(
        `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [orderId, menuItemId, quantity, unitPrice]
      );
    }

    await conn.commit();

    // Read the created order back with items + user info
    const [orderRows] = await q(
      `SELECT o.*, u.name AS user_name FROM orders o
       JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      [orderId]
    );
    const [itemRows] = await q(
      `SELECT oi.*, mi.name FROM order_items oi
       JOIN menu_items mi ON mi.id = oi.menu_item_id WHERE oi.order_id = ?`,
      [orderId]
    );
    const payload = { ...orderRows[0], items: itemRows, user: { name: orderRows[0].user_name } };

    io.to(`canteen:${canteenId}`).emit("order:new", payload);
    res.status(201).json(payload);
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// USER: my orders
router.get("/mine", requireRole("USER"), async (req, res, next) => {
  try {
    const [orders] = await q(
      `SELECT o.*, c.name AS canteen_name
       FROM orders o JOIN canteens c ON c.id = o.canteen_id
       WHERE o.user_id = ? ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    if (!orders.length) return res.json([]);

    const orderIds = orders.map((o) => o.id);
    const [items] = await q(
      `SELECT oi.order_id, oi.quantity, oi.unit_price, mi.name
       FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );

    const byOrder = items.reduce((acc, it) => {
      (acc[it.order_id] ??= []).push(it);
      return acc;
    }, {});

    res.json(orders.map((o) => ({
      ...o,
      canteen: { name: o.canteen_name },
      items: byOrder[o.id] ?? [],
    })));
  } catch (e) { next(e); }
});

// STAFF: list canteen orders
router.get("/canteen", requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    const [orders] = await q(
      `SELECT o.*, u.name AS user_name
       FROM orders o JOIN users u ON u.id = o.user_id
       WHERE o.canteen_id = ? ORDER BY o.created_at DESC`,
      [req.user.canteenId]
    );

    if (!orders.length) return res.json([]);

    const orderIds = orders.map((o) => o.id);
    const [items] = await q(
      `SELECT oi.order_id, oi.quantity, oi.unit_price, mi.name
       FROM order_items oi JOIN menu_items mi ON mi.id = oi.menu_item_id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );
    const byOrder = items.reduce((acc, it) => {
      (acc[it.order_id] ??= []).push(it);
      return acc;
    }, {});

    res.json(orders.map((o) => ({
      ...o,
      user: { name: o.user_name },
      items: byOrder[o.id] ?? [],
    })));
  } catch (e) { next(e); }
});

// STAFF: update status → triggers user notification
router.patch("/:id/status", requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["CONFIRMED", "PREPARING", "READY", "PICKED_UP", "CANCELLED"];
    if (!allowed.includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const [rows] = await q(
      `SELECT id, user_id, pickup_code FROM orders WHERE id = ? AND canteen_id = ? LIMIT 1`,
      [req.params.id, req.user.canteenId]
    );
    if (!rows.length) return res.status(404).json({ message: "Order not found" });

    const order = rows[0];

    await q(`UPDATE orders SET status = ? WHERE id = ?`, [status, order.id]);

    const msgMap = {
      CONFIRMED:  `Order #${order.id} confirmed ✅`,
      PREPARING:  `Your order #${order.id} is being prepared 🍳`,
      READY:      `Order #${order.id} is ready! Pickup code: ${order.pickup_code} 🎉`,
      PICKED_UP:  `Order #${order.id} completed. Enjoy! 😋`,
      CANCELLED:  `Order #${order.id} was cancelled.`,
    };
    const msg = msgMap[status];

    await q(
      `INSERT INTO notifications (user_id, title, message, type, order_id)
       VALUES (?, ?, ?, 'ORDER_STATUS', ?)`,
      [order.user_id, "Order Update", msg, order.id]
    );

    io.to(`user:${order.user_id}`).emit("order:status", {
      orderId: order.id,
      status,
      message: msg,
    });

    res.json({ id: order.id, status, message: msg });
  } catch (e) { next(e); }
});

export default router;
