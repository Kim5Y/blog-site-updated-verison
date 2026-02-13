import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as PostService from "../services/post.service.js";

export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content } = req.body;

    const updatedPost = await PostService.updatePost(
      postId,
      req.user.id,
      { title, content },
      req,
    );

    return sendResponse(res, {
      message: "post updated sucessfully",
      data: updatedPost,
    });
  } catch (err) {
    console.log(err);
    if (
      err.message === "invalid post id" ||
      err.message === "post id must be a number" ||
      err.message === "invaid input"
    ) {
      return new ApiError(res, { message: err.message, statuscode: 400 });
    }
    if (err.message === "unauthorized") {
      return new ApiError(res, { message: "unauthorized", statuscode: 403 });
    }
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
