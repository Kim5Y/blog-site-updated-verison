import express from "express"
import verifyUser from "../utils/verifyUser.utils.js";
import {validatePost} from "../middlewares/postValidation.middleware.js"
import { createPosts } from "../controllers/createPost.controller.js";
const postRouter = express.Router();
// postRouter.get('/:id', getPost);
postRouter.post('/', validatePost,verifyUser,createPosts);
// postRouter.delete('/:id', deletePosts);
export default postRouter;