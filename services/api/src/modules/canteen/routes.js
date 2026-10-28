import { Router } from "express";
import { q } from "../../config/db.js";
import { auth, requireRole } from "../../middleware/auth.js";

const router = Router();

// Public list of canteens (for user app home)
router.get("/", async (_req, res, next) => {
  try {
    const [rows] = await q(
      `SELECT id, name, description, contact, is_open FROM canteens ORDER BY name`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// Staff: toggle open/closed
router.patch("/:id/toggle", auth, requireRole("STAFF", "ADMIN"), async (req, res, next) => {
  try {
    if (Number(req.params.id) !== req.user.canteenId)
      return res.status(403).json({ message: "Not your canteen" });
    await q(`UPDATE canteens SET is_open = NOT is_open WHERE id = ?`, [req.user.canteenId]);
    const [rows] = await q(`SELECT id, is_open FROM canteens WHERE id = ?`, [req.user.canteenId]);
    res.json(rows[0]);
  } catch (e) { next(e); }
});

export default router;
