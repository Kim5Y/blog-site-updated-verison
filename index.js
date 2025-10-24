import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { client } from "./config/redis.config.js";
import router from "./routes/router.js";
import env from "./config/env.js";
import pool from "./config/db.config.js";
// if(await client.connect())console.log("redis connected  successfully");
if(await pool.connect())console.log("Database connected successfully");
const PORT = env.PORT;
const app = express();
app.use(cookieParser())
app.use(express.json());
app.use(cors());
app.use("/api", router);
app.listen(PORT, () => console.log("server currently running on PORT:", PORT));