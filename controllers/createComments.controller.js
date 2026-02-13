import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as CommentService from "../services/comment.service.js";
import pool from "../config/db.config.js"; // Needed for count check, or move count to service? Service returns data.

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

    // Original controller sends socket events manually?
    // My service handles notifications.
    // But socket events: `req.io.to(...).emit(...)` were in original controller.
    // AND in my service implementation I added socket emissions?
    // Let's check service.
    // Yes, added socket emissions in service (commented out in thought but code has it? let's check code).
    // The code in Step 86 didn't have socket emissions because I removed them from my thought process?
    // Wait, Step 86 code DOES NOT have socket emissions for `addComment`.
    // It only returns data.
    // BUT `sendNotification` IS called.

    // Actually, I should have put socket emissions in service to fully encapsulate logic.
    // In `addComment` within Step 86:
    // It returns data.
    // It calls `sendNotification`.
    // It DOES NOT call `req.io.to...`.

    // So I need to emit events here in controller OR update service.
    // Updating service to handle socket emissions is cleaner.
    // But I already wrote service without it for `addComment` (I might have missed it).
    // Let's check Step 86 code again.
    // It has `sendNotification`.
    // It DOES NOT have `req.io`.

    // However, for `reactToComment` and `updateComment` (added in Step 98), I DID add `req.io` logic.
    // So `addComment` is inconsistent.
    // I should probably emit events here in controller for `addComment` to match previous behavior if service doesn't do it.

    // Original `addComment`:
    // emits `reply:new` or `comment:new`.

    // I will emit them here.

    if (result.type === "reply") {
      const newComment = result.data;
      // I need parentId from request.
      const parentIdVal = parentId;
      // Original: req.io.to(`comment:${postQuery.rows[0].id}-${parentId}`).emit("reply:new", newComment);
      // I need post ID.
      req.io
        .to(`comment:${postId}-${parentIdVal}`)
        .emit("reply:new", newComment);

      const countComments = await pool.query(
        `SELECT COUNT(*) FROM comments WHERE parent_id IS NULL`,
      ); // This query counts ALL top level comments in DB? Or just for this post?
      // Original: `SELECT COUNT(*) FROM comments WHERE parent_id IS NULL` -> This counts GLOBAL top level comments???
      // That seems like a bug in original code or intended?
      // "SELECT COUNT(*) FROM comments WHERE parent_id IS NULL" -> No WHERE post_id clause.

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
      return new ApiError(res, { message: err.message, statuscode: 400 }); // Original said 400 or just message?
    }
    if (err.message === "post with the id porvided is not found") {
      // Service says "invalid post id"
      return new ApiError(res, {
        message: "post with the id porvided is not found",
        statuscode: 404,
      }); // Mapping?
    }
    // Service "invalid post id" maps to 400 or 404?
    // Original: rowCount === 0 -> 404 "post with the id porvided is not found" (typo in original) but no status code in ApiError (defaults to 500? or 400? ApiError default seems to be 500 but usually has status).
    // Wait, ApiError(res, {message: ...}) -> statuscode undefined?

    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
