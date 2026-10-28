import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/routes.js";
import canteenRoutes from "./modules/canteen/routes.js";
import menuRoutes from "./modules/menu/routes.js";
import orderRoutes from "./modules/order/routes.js";
import notificationRoutes from "./modules/notification/routes.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // Allow both apps
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Explicitly allow PATCH
  allowedHeaders: ["Content-Type", "Authorization"], // Allow our JWT and JSON
  credentials: true,
}));

app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, db: "mysql" }));
app.use("/api/auth", authRoutes);
app.use("/api/canteens", canteenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(errorHandler);
export default app;
