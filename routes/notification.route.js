import express from "express";
import { mediumLimiter, strictLimiter } from "../config/rateLimit.config.js";
import verifyUser from "../utils/verifyUser.utils.js";
import {
  clearAll,
  getNotification,
  markAsRead,
} from "../controllers/notification.controller.js";
const notificationRouter = express.Router();
notificationRouter.get("/", mediumLimiter, verifyUser, getNotification);
notificationRouter.post("/read/:id", mediumLimiter, verifyUser, markAsRead);
notificationRouter.delete("/clear-all", strictLimiter, verifyUser, clearAll);
export default notificationRouter;
