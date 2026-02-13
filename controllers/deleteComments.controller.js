import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as CommentService from "../services/comment.service.js";

export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const commentId = parseInt(req.body.commentId);
    const userId = req.user.id;

    if (!postId || !commentId)
      return new ApiError(res, {
        message: "post id or comment id can not be falsy",
      });

    await CommentService.deleteComment(commentId, userId, req);

    await CommentService.deleteComment(commentId, userId, req);

    return sendResponse(res, { message: "commend deleted successfully" });
  } catch (err) {
    console.log(err);
    if (
      err.message === "invalid comment id" ||
      err.message === "comments not found"
    ) {
      return new ApiError(res, { message: "comments not found" });
    }
    if (err.message === "unauthorized") {
      return new ApiError(res, { message: "unauthorized", statuscode: 403 });
    }
    return new ApiError(res, { message: err.message }, err);
  }
};

//getting all post route
export const getPostComments = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (isNaN(postId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid post id" });

    const response = await CommentService.getPostComments(postId, page, limit);

    if (!response) {
      return res
        .status(404)
        .json({ success: false, message: "No comments found" });
    }

    return sendResponse(res, response);
  } catch (err) {
    console.error(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

//comment reaction
export const commentReation = async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const { postId } = req.body;

    const result = await CommentService.reactToComment(
      commentId,
      postId,
      req.user.id,
      req,
    );

    return sendResponse(res, {
      message: "Post reaction updated successfully",
      data: result,
    });
  } catch (err) {
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

//edith comment
export const edithComment = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { content, commentId } = req.body;

    const result = await CommentService.updateComment(
      commentId,
      postId,
      req.user.id,
      content,
      req,
    );

    return sendResponse(res, {
      message: "comment updated successfully",
      data: result,
    });
  } catch (err) {
    console.log(err);
    if (err.message === "unauthorized") {
      return new ApiError(res, { message: "unauthorized", statuscode: 403 });
    }
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
