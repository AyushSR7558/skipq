import { Router } from "express";
import { q, pool } from "../../config/db.js";
import { auth, requireRole } from "../../middleware/auth.js";

const router = Router();
router.use(auth);

// Public-ish list for a canteen
router.get("/canteen/:canteenId", async (req, res, next) => {
  try {
    const [rows] = await q(
      `SELECT mi.*, c.name AS category_name
       FROM menu_items mi JOIN categories c ON c.id = mi.category_id
       WHERE mi.canteen_id = ? AND mi.is_available = 1
       ORDER BY c.name, mi.name`,
      [req.params.canteenId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// Staff: own menu
router.get("/my-canteen", requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    const [rows] = await q(
      `SELECT mi.*, c.name AS category_name
       FROM menu_items mi JOIN categories c ON c.id = mi.category_id
       WHERE mi.canteen_id = ? ORDER BY mi.created_at DESC`,
      [req.user.canteenId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// Staff: add
router.post("/", requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, description, price, categoryId, prepTimeMin, imageUrl, isVeg, customizations } = req.body;
    
    // 1. Insert the main menu item
    const [r] = await conn.query(
      `INSERT INTO menu_items
        (name, description, price, category_id, prep_time_min, image_url, is_veg, canteen_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description ?? null, price, categoryId, prepTimeMin ?? 10, imageUrl ?? null, isVeg ? 1 : 0, req.user.canteenId]
    );
    const itemId = r.insertId;

    // 2. Insert the customizations (if any were provided)
    if (customizations && Array.isArray(customizations) && customizations.length > 0) {
      for (const c of customizations) {
        if (c.name && c.name.trim() !== "") {
          await conn.query(
            `INSERT INTO customizations (menu_item_id, name, extra_price) VALUES (?, ?, ?)`,
            [itemId, c.name, c.extraPrice || 0]
          );
        }
      }
    }

    await conn.commit();
    res.status(201).json({ id: itemId });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally {
    conn.release();
  }
});

// Staff: update
router.patch("/:id", requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    // ADD "is_veg" TO THIS ARRAY
    const fields = ["name", "description", "price", "category_id", "prep_time_min", "is_available", "image_url", "is_veg"];
    const updates = [];
    const params = [];
    
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        updates.push(`${f} = ?`);
        // If it's is_veg or is_available, ensure it's a 1 or 0 for MySQL
        if (f === "is_veg" || f === "is_available") {
          params.push(req.body[f] ? 1 : 0);
        } else {
          params.push(req.body[f]);
        }
      }
    }
    
    if (!updates.length) return res.status(400).json({ message: "Nothing to update" });
    params.push(req.params.id, req.user.canteenId);

    const [r] = await q(
      `UPDATE menu_items SET ${updates.join(", ")}
       WHERE id = ? AND canteen_id = ?`,
      params
    );
    if (!r.affectedRows) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Staff: delete
router.delete("/:id", requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    const [r] = await q(
      `DELETE FROM menu_items WHERE id = ? AND canteen_id = ?`,
      [req.params.id, req.user.canteenId]
    );
    if (!r.affectedRows) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    // FK constraint if the item has been ordered
    if (e.code === "ER_ROW_IS_REFERENCED_2")
      return res.status(409).json({ message: "Item is used in past orders — mark unavailable instead" });
    next(e);
  }
});

// Add this new route to get a single item with its customizations
router.get("/item/:id", async (req, res, next) => {
  try {
    const [items] = await q(`SELECT * FROM menu_items WHERE id = ?`, [req.params.id]);
    if (!items.length) return res.status(404).json({ message: "Item not found" });

    const [customs] = await q(`SELECT * FROM customizations WHERE menu_item_id = ?`, [req.params.id]);
    res.json({ ...items[0], customizations: customs });
  } catch (e) { next(e); }
});

// Update the POST route to handle customizations when adding an item
router.post("/", requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { name, description, price, categoryId, prepTimeMin, isVeg, customizations } = req.body;

    const [r] = await conn.query(
      `INSERT INTO menu_items (name, description, price, category_id, prep_time_min, is_veg, canteen_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, categoryId, prepTimeMin, isVeg ? 1 : 0, req.user.canteenId]
    );
    const itemId = r.insertId;

    // Insert customizations if provided
    if (customizations && customizations.length > 0) {
      for (const c of customizations) {
        await conn.query(
          `INSERT INTO customizations (menu_item_id, name, extra_price) VALUES (?, ?, ?)`,
          [itemId, c.name, c.extraPrice]
        );
      }
    }

    await conn.commit();
    res.status(201).json({ id: itemId });
  } catch (e) {
    await conn.rollback();
    next(e);
  } finally { conn.release(); }
});

router.get("/item/:id", async (req, res, next) => {
  try {
    const [items] = await q(`SELECT * FROM menu_items WHERE id = ?`, [req.params.id]);
    if (!items.length) return res.status(404).json({ message: "Item not found" });

    const [customs] = await q(`SELECT * FROM customizations WHERE menu_item_id = ?`, [req.params.id]);
    res.json({ ...items[0], customizations: customs });
  } catch (e) { next(e); }
});

export default router;
