import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as PostService from "../services/post.service.js";

export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    // Service handles postId validation but controller passed it as parsed int.
    // Logic: if not a number... handled in service.

    const result = await PostService.reactToPost(postId, req.user.id, req);

    return sendResponse(res, {
      message: "Post reaction updated successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    if (
      err.message === "invalid post id" ||
      err.message === "post id must be a number"
    ) {
      return new ApiError(res, { message: err.message, statuscode: 400 });
    }
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
