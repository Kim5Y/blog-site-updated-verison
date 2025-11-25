import express from "express";
import authenticationRouter from "./authentication.route.js";
import commentsRouter from "./comments.route.js";
import postRouter from "./post.route.js";
import { flexibleLimiter } from "../config/rateLimit.config.js";
import searchpostController from "../config/searchpost.controller.js";
import verifyUser from "../utils/verifyUser.utils.js";
const router = express.Router();
router.use("/auth", flexibleLimiter, authenticationRouter);
router.use("/post", flexibleLimiter, postRouter);
router.use("/comment", flexibleLimiter, commentsRouter);
router.get('/search', flexibleLimiter, verifyUser, searchpostController)
export default router;
