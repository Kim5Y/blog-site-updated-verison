import express from "express";
import authenticationRouter from "./authentication.route.js";
import commentsRouter from "./comments.route.js";
import postRouter from "./post.route.js";
const router = express.Router();
router.use("/auth", authenticationRouter);
router.use("/post", postRouter);
router.use("/comment", commentsRouter);
export default router;
