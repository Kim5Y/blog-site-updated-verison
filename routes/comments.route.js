import express from "express";
import createComments from "../controllers/createComments.controller.js";
import { createCommentValidation } from "../middlewares/postValidation.middleware.js";
import verifyUser from "../utils/verifyUser.utils.js";
import deleteCommentsController, {
  commentReation,
  edithComment,
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
commentsRouter.patch("/:id", createCommentValidation, verifyUser, edithComment);
export default commentsRouter;

// ALTER TABLE users
// ADD COLUMN image_url TEXT DEFAULT 'https://res.cloudinary.com/dmmqpd9oo/image/upload/c_fill,w_1200,h_1200,ar_1:1/v1763546712/0684456b-aa2b-4631-86f7-93ceaf33303c_uh0gkq.jpg';