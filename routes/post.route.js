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
const postRouter = express.Router();
postRouter.post("/", validatePost, verifyUser, createPosts);
postRouter.get("/", verifyUser, getPostsController);
postRouter.get("/:slug", verifyUser, getPostBySlug);
postRouter.delete("/:id", verifyUser, deletePostController);
postRouter.patch('/:id', verifyUser, edithPostController);
postRouter.post('/reactions/:id', verifyUser, postReactionsController);
export default postRouter;