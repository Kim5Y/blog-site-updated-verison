import sendResponse from "../utils/sendResponse.util.js";
import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
export default async (req, res) => {
  const client = await pool.connect();
  try {
    const postId = parseInt(req.params.id);
    if (!/^\d+$/.test(postId))
      return new ApiError(res, {
        message: "post id must be a number",
        statuscode: 400,
      });
    await client.query("BEGIN");
    const query = `SELECT * FROM posts WHERE id = $1`;
    const result = await pool.query(query, [postId]);
    if (result.rowCount == 0) {
      await client.query("ROLLBACK");
      return new ApiError(res, { message: "invalid post id", statuscode: 400 });
    }
    if (result.rows[0].user_id !== req.user.id) {
      await client.query("ROLLBACK");
      return new ApiError(res, { message: "invalid", statuscode: 403 });
    }
    const POST = result.rows[0];
    const category = POST.category;
    const deltedPost = await pool.query(`DELETE FROM posts WHERE id = $1`, [
      POST.id,
    ]);
    await client.query("COMMIT");
    req.io.to(`post:${postId}`).emit("post:deleted", POST);
    return sendResponse(res, { message: "post deleted successfully" });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  } finally {
   client.release();
  }
};
