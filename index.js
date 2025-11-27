import express from "express";
import http from "http";
import cookieParser from "cookie-parser";
import cors from "cors";
import ApiError from "./utils/error.utils.js";
import router from "./routes/router.js";
import env from "./config/env.js";
import pool from "./config/db.config.js";
import { initSocket } from "./config/socketio.config.js";
pool.connect().then(()=> console.log("database connected successfully")).catch((error)=> console.log(error));
const PORT = env.PORT;
const app = express();
const server = http.createServer(app);
const IO = initSocket(server);
app.use((req, res, next) => {
  try {
    if (!IO) throw new Error("Socket.io not initialized!");
    req.io = IO;
  } catch (err) {
    return new ApiError(res, { errors: err.message }, err);
  }
  next();
});

app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use("/api", router);
server.listen(PORT, () =>
  console.log("server currently running on PORT:", PORT)
);
