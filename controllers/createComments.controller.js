import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as CommentService from "../services/comment.service.js";
import pool from "../config/db.config.js";

export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const { content, parentId } = req.body;

    if (!postId || isNaN(postId))
      return new ApiError(res, { message: "invalid post id" });
    if (!content)
      return new ApiError(res, { message: "comment content cannot be empty" });

    // The original logic returns totalComments.
    // I should probably move the total count logic to service too, or query it here.
    // Service returns { type, data }.

    const result = await CommentService.addComment(
      { postId, content, userId, parentId },
      req,
    );

    if (result.type === "reply") {
      const newComment = result.data;
      // I need parentId from request.
      const parentIdVal = parentId;
      // I need post ID.
      req.io
        .to(`comment:${postId}-${parentIdVal}`)
        .emit("reply:new", newComment);

      const countComments = await pool.query(
        `SELECT COUNT(*) FROM comments WHERE parent_id IS NULL`,
      );

      return sendResponse(res, {
        statusCodes: 201,
        data: {
          newComment,
          totalComments: countComments.rows[0].count,
        },
      });
    } else {
      const newComment = result.data;
      req.io.to(`post:${postId}`).emit("comment:new", newComment);

      const countComments = await pool.query(
        `SELECT COUNT(*) FROM comments WHERE parent_id IS NULL`,
      );

      return sendResponse(res, {
        statusCodes: 201,
        data: {
          newComment,
          totalComments: countComments.rows[0].count,
        },
      });
    }
  } catch (err) {
    console.log(err);
    if (
      err.message === "invalid post id" ||
      err.message === "post id must be a number"
    ) {
      return new ApiError(res, { message: err.message, statuscode: 400 });
    }
    if (err.message === "post with the id porvided is not found") {
      return new ApiError(res, {
        message: "post with the id porvided is not found", // typos preserved from original
        statuscode: 404,
      });
    }

    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
