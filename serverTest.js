import express from "express"                                       
import router from "./routes/router.js";
import cookieParser from "cookie-parser";
import cors from "cors";

export const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use("/api", router);