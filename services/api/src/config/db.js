import "dotenv/config";
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "Z",
  decimalNumbers: true, // return DECIMAL as JS number, not string
});

// tiny helper so routes read nicely: const [rows] = await q("SELECT ...")
export const q = (sql, params) => pool.query(sql, params);

export async function pingDb() {
  const conn = await pool.getConnection();
  try { await conn.ping(); } finally { conn.release(); }
  console.log("✅ MySQL connected");
}
