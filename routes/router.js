import express from "express";
import authenticationRouter from "./authentication.route.js";
import commentsRouter from "./comments.route.js";
import postRouter from "./post.route.js";
import { mediumLimiter } from "../config/rateLimit.config.js";
import searchpostController from "../controllers/searchpost.controller.js";
import verifyUser from "../utils/verifyUser.utils.js";
import notificationRouter from "./notification.route.js";
const router = express.Router();
router.use("/auth", authenticationRouter);
router.use("/post", postRouter);
router.use("/comment", commentsRouter);
router.get("/search", mediumLimiter, verifyUser, searchpostController);
router.use("/notification", notificationRouter);
export default router;
//delete, mark as read
