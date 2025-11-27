import express from "express";
import verifyUser from "../utils/verifyUser.utils.js";
import { validatePost } from "../middlewares/postValidation.middleware.js";
import { createPosts } from "../controllers/createPost.controller.js";
import getPostsController, {
  getPostBySlug,
} from "../controllers/getPosts.controller.js";
import edithPostController from "../controllers/edithPost.controller.js";
import deletePostController from "../controllers/deletePost.controller.js";
import postReactionsController from "../controllers/postReactions.controller.js";
import { mediumLimiter, strictLimiter } from "../config/rateLimit.config.js";
export const postRouter = express.Router();
postRouter.post("/", mediumLimiter, validatePost, verifyUser, createPosts);
postRouter.get("/", mediumLimiter, verifyUser, getPostsController);
postRouter.get("/:slug", strictLimiter, verifyUser,getPostBySlug);
postRouter.delete("/:id", mediumLimiter,verifyUser, deletePostController);
postRouter.patch(
  "/:id",
  mediumLimiter,
  validatePost,
  verifyUser,
  edithPostController
);
postRouter.post(
  "/reaction/:id",
  mediumLimiter,
  verifyUser,
  postReactionsController
);
export default postRouter;
//check the get post by slug cuz i removed the verify user middlew
