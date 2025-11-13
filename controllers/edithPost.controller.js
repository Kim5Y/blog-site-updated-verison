import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
import sendResponse from "../utils/sendResponse.util.js";
export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, content } = req.body;
     if (!/^\d+$/.test(postId))
      return new ApiError(res, {
        message: "post id must be a number",
        statuscode: 400,
      });
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
    const updatePostQuery = await pool.query(
      `UPDATE posts
       SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [title, content, post.id]
    );
    const updatedPost = updatePostQuery.rows[0];
    const sendToConnectedUsers = req.io.to(`category-${updatedPost.category}`)
      .emit("post:updated", updatedPost);
    if (sendToConnectedUsers)
      return sendResponse(res, { message: "post updated sucessfully" , data: updatedPost});
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
