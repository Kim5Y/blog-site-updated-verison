import express from "express";
import { mediumLimiter } from "../config/rateLimit.config.js";
import verifyUser from "../utils/verifyUser.utils.js";
import { getNotification } from "../controllers/notification.controller.js";
const notificationRouter = express.Router();
notificationRouter.get("/", mediumLimiter, verifyUser, getNotification);
export default notificationRouter;
