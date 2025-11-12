import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
import sendResponse from "../utils/sendResponse.util.js";
import { getIO } from "../index.js";
export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content } = req.body;
    const io = getIO();
    if (!postId)
      return new ApiError(res, { message: "invalid post id", statuscode: 400 });
    if (!title || !content)
      return new ApiError(res, { message: "invaid input", statuscode: 400 });
    const postQuery = await pool.query(`SELECT * FROM posts WHERE id = $1`, [
      postId,
    ]);
    const post = postQuery.rows[0];
    if (postQuery.rowCount <= 0)
      return new ApiError(res, { message: "invalid post id", statuscode: 400 });
    if (post.user_id !== req.user.id)
      return new ApiError(res, { message: "unauthorized", statuscode: 403 });
    const updatedPost = await pool.query(
      `UPDATE posts
       SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [title, content, post.id]
    );
  } catch (err) {
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
