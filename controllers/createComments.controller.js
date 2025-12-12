import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
import sendResponse from "../utils/sendResponse.util.js";
import { sendNotification } from "../services/notifications.service.js";
export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const { content, parentId } = req.body;
    if (!postId) return new ApiError(res, { message: "invalid post Id" });
    if (isNaN(postId)) return new ApiError(res, { message: "invalid post id" });
    if (!content)
      return new ApiError(res, { message: "comment content cannot be empty" });
    const postQuery = await pool.query(`SELECT * FROM posts WHERE id=$1`, [
      postId,
    ]);
    if (postQuery.rowCount === 0)
      return new ApiError(res, {
        message: "post with the id porvided is not found",
      });
    if (parentId) {
      const findParentComment = await pool.query(
        `SELECT * FROM comments WHERE id = $1`,
        [parentId]
      );
      if (findParentComment.rowCount === 0)
        return new ApiError(res, { message: "parent comment not found" });
      const commentQuery = await pool.query(
        `
      INSERT INTO comments (post_id, content, parent_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `,
        [postId, content, parentId, userId]
      );
      const newComment = commentQuery.rows[0];
      const countComments = await pool.query(
        `SELECT COUNT(*) FROM comments WHERE parent_id IS NULL`
      );
      req.io
        .to(`comment:${postQuery.rows[0].id}-${parentId}`)
        .emit("comment:new", newComment);
      if (userId != findParentComment.rows[0].user_id) {
        sendNotification(req, {
          userId: findParentComment.rows[0].user_id,
          action: "reply",
          actorId: newComment.user_id,
          entityId: findParentComment.rows[0].id,
          entityType: "comment",
        });
      }
      return sendResponse(res, {
        statusCodes: 201,
        data: {
          newComment,
          totalComments: countComments.rows[0].count,
        },
      });
    }
    const commentQuery = await pool.query(
      `
      INSERT INTO comments (post_id, content, user_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
      [postId, content, userId]
    );
    const countComments = await pool.query(
      `SELECT COUNT(*) FROM comments WHERE parent_id IS NULL`
    );
    const newComment = commentQuery.rows[0];
    req.io.to(`post:${postQuery.rows[0].id}`).emit("comment:new", newComment);
    console.log(postQuery.rows[0]);
    sendNotification(req, {
      userId: postQuery.rows[0].user_id,
      action: "new",
      actorId: newComment.user_id,
      entityId: postQuery.rows[0].id,
      entityType: "comment",
    });

    return sendResponse(res, {
      statusCodes: 201,
      data: {
        newComment,
        totalComments: countComments.rows[0].count,
      },
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
