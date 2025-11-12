import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import { client } from "./config/redis.config.js";
import ApiError from "./utils/error.utils.js";
import router from "./routes/router.js";
import env from "./config/env.js";
import pool from "./config/db.config.js";
import { initSocket } from "./config/socketio.config.js";
try {
  if (await client.connect()) console.log("redis connected  successfully");
  if (await pool.connect()) console.log("Database connected successfully");
} catch (error) {
  console.log(error);
}
const PORT = env.PORT;
const app = express();
const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// });

export const getIO = (res) => {
  try {
    const IO = initSocket(server, res);
    if (!IO) throw new Error("Socket.io not initialized!");
    return IO;
  } catch (err) {
    return new ApiError(res, { errors: err.message }, err);
  }
};
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use("/api", router);
server.listen(PORT, () =>
  console.log("server currently running on PORT:", PORT)
);