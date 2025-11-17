import express from "express";
import createComments from "../controllers/createComments.controller.js";
import { createCommentValidation } from "../middlewares/postValidation.middleware.js";
import verifyUser from "../utils/verifyUser.utils.js";
import deleteCommentsController, {
  commentReation,
  getPostComments,
} from "../controllers/deleteComments.controller.js";
const commentsRouter = express.Router();
commentsRouter.post(
  "/:id",
  verifyUser,
  createCommentValidation,
  createComments
);
commentsRouter.delete("/:id", verifyUser, deleteCommentsController);
commentsRouter.get("/:id", verifyUser, getPostComments);
commentsRouter.post("/reaction/:id", verifyUser, commentReation);
export default commentsRouter;
