import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
import sendResponse from "../utils/sendResponse.util.js";

export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (!/^\d+$/.test(postId))
      return new ApiError(res, {
        message: "post id must be a number",
        statuscode: 400,
      });
    const userId = req.user.id;
    const postQuery = await pool.query(`SELECT * FROM posts WHERE id=$1`, [
      postId,
    ]);
    const post = postQuery.rows[0];
    const reactions = await pool.query(
      `SELECT * FROM post_reactions WHERE post_id = $1 AND user_id = $2`,
      [postId, userId]
    );
    let result;
    if (reactions.rowCount === 0) {
      result = await pool.query(
        `INSERT INTO post_reactions (user_id, post_id, reaction_type, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [userId, postId, "like"]
      );
      const totalLikes = await pool.query(
        `SELECT COUNT(*) AS likes FROM post_reactions WHERE post_id = $1 AND reaction_type = 'like'`,
        [postId]
      );
      const updated = result.rows[0];
      req.io.to(`category-${post.category}`).emit("post:reactionUpdated", {
        postId,
        total_likes: Number(totalLikes.rows[0].likes),
      });
      return sendResponse(res, {
        message: "Post reaction updated successfully",
        data: {
          postId,
          reaction: updated,
          total_likes: Number(totalLikes.rows[0].likes),
        },
      });
    }
    await pool.query(
      `DELETE FROM post_reactions WHERE post_id=$1 AND user_id=$2`,
      [postId, userId]
    );
    const totalLikes = await pool.query(
      `SELECT COUNT(*) AS likes FROM post_reactions WHERE post_id = $1 AND reaction_type = 'like'`,
      [postId]
    );
    await req.io.to(`category-${post.category}`).emit("post:reactionUpdated", {
      postId,
      total_likes: Number(totalLikes.rows[0].likes),
    });
    
    return sendResponse(res, {
      message: "Post reaction updated successfully",
      data: {
        postId,
        total_likes: Number(totalLikes.rows[0].likes),
      },
    });
  } catch (err) {
    console.error(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};