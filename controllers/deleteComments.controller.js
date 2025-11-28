import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import pool from "../config/db.config.js";
import { client } from "../config/redis.config.js";
import { sendNotification } from "../services/notifications.service.js";
//create comment route
export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const commentId = parseInt(req.body.commentId);
    const userId = req.user.id;
    if (!postId || !commentId)
      return new ApiError(res, {
        message: "post id or comment id can not be falsy",
      });
    if (isNaN(postId))
      return new ApiError(res, { message: "invalid comment id" });
    if (isNaN(commentId))
      return new ApiError(res, { message: "invalid comment id" });
    const checkComments = await pool.query(
      `SELECT * FROM comments WHERE id=$1 AND post_id=$2 AND user_id=$3`,
      [commentId, postId, userId]
    );
    if (checkComments.rowCount === 0)
      return new ApiError(res, { message: "comments not found" });
    const comment = checkComments.rows[0];
    const deleteComment = await pool.query(
      `DELETE FROM comments WHERE id=$1 AND post_id=$2 AND user_id=$3 `,
      [comment.id, comment.post_id, comment.user_id]
    );
    if (checkComments.rows[0].parent_id !== null) {
      req.io
        .to(`post:${postId}-${checkComments.rows[0].parent_id}`)
        .emit("comment:delete", deleteComment.rows[0]);
    }
    req.io
      .to(`comment:${postId}`)
      .emit("comment:delete", deleteComment.rows[0]);
    return res.sendResponse(res, { message: "commend deleted successfullu" });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message }, err);
  }
};
//getting all post route
export const getPostComments = async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const cacheKey = `comments:page:${page}:limit:${limit}`;
    const cacheCommentData = await client.get(cacheKey);
    if (cacheCommentData) {
      console.log("fetching from cache");
      const comments = JSON.parse(cacheCommentData);
      return sendResponse(res, comments);
    }
    if (isNaN(postId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid post id" });
    const { rows: allComments } = await pool.query(
      `SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
      [postId]
    );

    if (allComments.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "No comments found" });
    const topLevelComments = allComments.filter((c) => c.parent_id === null);
    const paginatedTopLevel = topLevelComments.slice(offset, offset + limit);
    const commentMap = {};
    allComments.forEach((c) => (commentMap[c.id] = { ...c, replies: [] }));
    allComments.forEach((c) => {
      if (c.parent_id !== null) {
        const parent = commentMap[c.parent_id];
        if (parent) parent.replies.push(commentMap[c.id]);
      }
    });
    const result = paginatedTopLevel.map((c) => commentMap[c.id]);

    const response = {
      success: true,
      data: result,
      meta: {
        totalComments: topLevelComments.length,
        page,
        limit,
      },
    };
    await client.setEx(cacheKey, 60, JSON.stringify(response));
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
    const userId = parseInt(req.user.id);
    if (isNaN(commentId))
      return new ApiError(res, { message: "invalid comment id" });

    const { rows: comments } = await pool.query(
      `SELECT * FROM comments WHERE id=$1`,
      [commentId]
    );
    if (comments.length == 0)
      return new ApiError(res, {
        message: "comment not found check the comment id",
        statuscode: 404,
      });
    const { rows: userReaction } = await pool.query(
      `SELECT * FROM comment_reactions WHERE comment_id = $1 AND user_id = $2`,
      [commentId, userId]
    );
    let result;
    if (userReaction.length == 0) {
      result = await pool.query(
        `INSERT INTO comment_reactions (user_id, comment_id, reaction_type, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [userId, commentId, "like"]
      );
      const totalLikes = await pool.query(
        `SELECT COUNT(*) AS likes FROM comment_reactions WHERE comment_id = $1 AND reaction_type = 'like'`,
        [commentId]
      );
      if (req.user.id != comments[0].user_id) {
        sendNotification(req, {
          userId: comments[0].user_id,
          actorId: userId,
          action: "like",
          entityType: "comment",
          entityId: commentId,
        });
      };
      const updated = result.rows[0];
      return sendResponse(res, {
        message: "Post reaction updated successfully",
        data: {
          commentId,
          reaction: updated,
          total_likes: Number(totalLikes.rows[0].likes),
        },
      });
    }
    await pool.query(
      `DELETE FROM comment_reactions WHERE comment_id=$1 AND user_id=$2`,
      [commentId, userId]
    );
    const totalLikes = await pool.query(
      `SELECT COUNT(*) AS likes FROM comment_reactions WHERE comment_id = $1 AND reaction_type = 'like'`,
      [commentId]
    );
    return sendResponse(res, {
      message: "Post reaction updated successfully",
      data: {
        commentId,
        total_likes: Number(totalLikes.rows[0].likes),
      },
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
    if (isNaN(commentId))
      return new ApiError(res, {
        message: "invalid comment id",
        statuscode: 400,
      });
    if (!content)
      return new ApiError(res, { message: "invalid content", statuscode: 400 });
    const { rows: userComment } = await pool.query(
      `SELECT * FROM comments WHERE id=$1 AND post_id=$2`,
      [commentId, postId]
    );
    if (userComment.length === 0)
      return new ApiError(res, {
        message: "invalid comment id",
        statuscode: 400,
      });
    if (userComment[0].user_id !== req.user.id)
      return new ApiError(res, { message: "unauthorized", statuscode: 403 });
    const { rows: updatedComment } = await pool.query(
      `UPDATE comments
       SET  content = $1, updated_at = NOW()
       WHERE id = $3 AND post_id=$2
       RETURNING *`,
      [content, postId, userComment[0].id]
    );
    if (userComment.rows[0].parent_id !== null) {
      req.io.to(`comment:${postId}-${userComment[0].parent_id}`);
      return sendResponse(res, {
        message: "comment updated successfully",
        data: updatedComment[0],
      });
    }
    req.io.to(`post:${postId}`).emit("comment:edith", updatedComment[0]);
    return sendResponse(res, {
      message: "comment updated successfully",
      data: updatedComment[0],
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
