import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let ioInstance;
export const io = {
  to: (room) => ioInstance.to(room),
  emit: (...args) => ioInstance.emit(...args),
};

export const initSocket = (server) => {
  ioInstance = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:5174"],
      methods: ["GET", "POST", "PATCH"],
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      socket.user = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      next();
    } catch { next(new Error("Unauthorized")); }
  });

  ioInstance.on("connection", (socket) => {
    const { id, role, canteenId } = socket.user;
    if (role === "USER") socket.join(`user:${id}`);
    if (role === "STAFF" || role === "ADMIN") socket.join(`canteen:${canteenId}`);
    console.log(`🔌 ${role} ${id} connected`);
  });
};
