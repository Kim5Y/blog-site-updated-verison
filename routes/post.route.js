import express from "express";
import verifyUser from "../utils/verifyUser.utils.js";
import { validatePost } from "../middlewares/postValidation.middleware.js";
import { createPosts } from "../controllers/createPost.controller.js";
import getPostsController, {
  getPostBySlug,
} from "../controllers/getPosts.controller.js";
import edithPostController from "../controllers/edithPost.controller.js";
import deletePostController from "../controllers/deletePost.controller.js";
const postRouter = express.Router();
postRouter.post("/", validatePost, verifyUser, createPosts);
postRouter.get("/", verifyUser, getPostsController);
postRouter.get("/:slug", verifyUser, getPostBySlug);
postRouter.delete("/:id", verifyUser, deletePostController);
postRouter.patch('/:id', verifyUser, edithPostController);
export default postRouter;