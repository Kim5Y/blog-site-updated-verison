import sendResponse from "../utils/sendResponse.util.js";
import ApiError from "../utils/error.utils.js";
import { sendNotification } from "../services/notifications.service.js";
import pool from "../config/db.config.js";
export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    console.log(req.user);
    if (!/^\d+$/.test(postId))
      return new ApiError(res, {
        message: "post id must be a number",
        statuscode: 400,
      });
    const query = `SELECT * FROM posts WHERE id = $1`;
    const result = await pool.query(query, [postId]);
    if (result.rowCount == 0)
      return new ApiError(res, { message: "invalid post id", statuscode: 400 });
    if (result.rows[0].user_id !== req.user.id)
      return new ApiError(res, { message: "invalid", statuscode: 403 });
    const POST = result.rows[0];
    const category = POST.category;
    const deltedPost = await pool.query(`DELETE FROM posts WHERE id = $1`, [
      POST.id,
    ]);
    req.io.to(`post:${postId}`).emit("post:deleted", POST);
    return sendResponse(res, { message: "post deleted successfully" });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
