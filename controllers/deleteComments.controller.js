import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import pool from "../config/db.config.js";
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
    return res.sendStatus(200);
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message }, err);
  }
};
