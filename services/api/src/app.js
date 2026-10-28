import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/routes.js";
import canteenRoutes from "./modules/canteen/routes.js";
import menuRoutes from "./modules/menu/routes.js";
import orderRoutes from "./modules/order/routes.js";
import notificationRoutes from "./modules/notification/routes.js";
import featureRoutes from "./modules/features/routes.js"; // <-- ADD THIS IMPORT
import { errorHandler } from "./middleware/error.js";

const app = express();
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, db: "mysql" }));
app.use("/api/auth", authRoutes);
app.use("/api/canteens", canteenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/features", featureRoutes); // <-- ADD THIS LINE

app.use(errorHandler);
export default app;
