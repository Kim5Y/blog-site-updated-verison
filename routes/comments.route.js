import express from "express";
import createComments from "../controllers/createComments.controller.js";
import { createCommentValidation } from "../middlewares/postValidation.middleware.js";
import verifyUser from "../utils/verifyUser.utils.js";
import deleteCommentsController, {
  commentReation,
  edithComment,
  getPostComments,
} from "../controllers/deleteComments.controller.js";
import { mediumLimiter } from "../config/rateLimit.config.js";
const commentsRouter = express.Router();
commentsRouter.post(
  "/:id",
  mediumLimiter,
  verifyUser,
  createCommentValidation,
  createComments
);
commentsRouter.delete(
  "/:id",
  mediumLimiter,
  verifyUser,
  deleteCommentsController
);
commentsRouter.get("/:id", mediumLimiter, verifyUser, getPostComments);
commentsRouter.post("/reaction/:id", mediumLimiter, verifyUser, commentReation);
commentsRouter.patch(
  "/:id",
  mediumLimiter,
  createCommentValidation,
  verifyUser,
  edithComment
);
export default commentsRouter;