import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer ")) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(h.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
  next();
};
