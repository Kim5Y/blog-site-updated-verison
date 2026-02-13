import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as PostService from "../services/post.service.js";

export default async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const response = await PostService.getPaginatedPosts(page, limit);

    return sendResponse(res, { data: response.data, meta: response.meta });
  } catch (err) {
    console.log(err);
    return new ApiError(
      res,
      { statuscode: 500, message: err.message, errors: err },
      err,
    );
  }
};

export const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // No need to check slug existence if service throws error?
    // Or controller checks presence.
    if (!slug)
      return new ApiError(res, { message: "invalid slug", statuscode: 400 });

    const post = await PostService.getPostBySlug(slug);

    return sendResponse(res, { data: post });
  } catch (err) {
    console.log(err);
    // If service throws "post not found", map to 404
    if (err.message === "post not found") {
      return new ApiError(res, { message: "post not found", statuscode: 404 });
    }
    return new ApiError(
      res,
      { statuscode: 500, message: err.message, errors: err },
      err,
    );
  }
};
