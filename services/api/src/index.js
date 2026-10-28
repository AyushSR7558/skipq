import "dotenv/config";
import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/index.js";
import { pingDb } from "./config/db.js";

const server = http.createServer(app);
initSocket(server);

await pingDb();
server.listen(process.env.PORT || 4000, () =>
  console.log(`🚀 API on http://localhost:${process.env.PORT || 4000}`)
);
