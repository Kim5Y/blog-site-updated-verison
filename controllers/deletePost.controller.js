import sendResponse from "../utils/sendResponse.util.js";
import ApiError from "../utils/error.utils.js";
import * as PostService from "../services/post.service.js";

export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);

    await PostService.deletePost(postId, req.user.id, req);

    return sendResponse(res, { message: "post deleted successfully" });
  } catch (err) {
    console.log(err);
    if (
      err.message === "invalid post id" ||
      err.message === "post id must be a number"
    ) {
      return new ApiError(res, { message: err.message, statuscode: 400 });
    }
    if (err.message === "unauthorized") {
      return new ApiError(res, { message: "invalid", statuscode: 403 });
    }
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
