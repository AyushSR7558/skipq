import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { q } from "../../config/db.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, rollNumber } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "name, email, password required" });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await q(
      `INSERT INTO users (name, email, password, roll_number, role)
       VALUES (?, ?, ?, ?, 'USER')`,
      [name, email, hash, rollNumber ?? null]
    );

    res.status(201).json({ id: result.insertId, email });
  } catch (e) {
    if (e.code === "ER_DUP_ENTRY")
      return res.status(409).json({ message: "Email or roll number already exists" });
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const [rows] = await q(
      `SELECT id, name, email, password, role, canteen_id FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, canteenId: user.canteen_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, canteenId: user.canteen_id },
    });
  } catch (e) { next(e); }
});

export default router;
