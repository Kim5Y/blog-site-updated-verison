import sendResponse from "../utils/sendResponse.util.js";
import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    if (!/^\d+$/.test(postId))
      return new ApiError(res, {
        message: "post id must be a number",
        statuscode: 400,
      });
    const query = `SELECT * FROM posts WHERE id = $1`;
    const result = await pool.query(query, [postId]);
    if (result.user_id !== req.user.id)
      return new ApiError(res, { message: "invalid", statuscode: 403 });
    if (result.rowCount <= 0)
      return new ApiError(res, { message: "invalid post id", statuscode: 400 });
    const POST = result.rows[0];
    const category = POST.category;
    console.log({ category, POST });
    const deltedPost = await pool.query(`DELETE FROM posts WHERE id = $1`, [
      POST.id,
    ]);
    if (deltedPost) {
      req.io.to(`category-${category}`).emit("post:deleted", POST);
    }
    return sendResponse(res, { message: "post deleted successfully" });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
