import { Router } from "express";
import { q } from "../../config/db.js";
import { auth } from "../../middleware/auth.js";

const router = Router();
router.use(auth);

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await q(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.patch("/:id/read", async (req, res, next) => {
  try {
    await q(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
