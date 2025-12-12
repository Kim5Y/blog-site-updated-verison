import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import pool from "../config/db.config.js";
import { client } from "../config/redis.config.js";

export default async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    let postCount = null;
    let userPosts = null;
    if (!userId) return new ApiError(res, { message: "invalid user id" });
    if (isNaN(userId))
      return new ApiError(res, { statuscode: 400, message: "invalid userId" });
    const cacheKey = `userProfileInfo:page:${page}:limit:${limit}`;
    const cachedDataExists = await client.get(cacheKey);
    if (cachedDataExists) {
      console.log("fetching data from cache");
      const response = JSON.parse(cachedDataExists);
      return sendResponse(res, response);
    }
    const userInfoQuery = await pool.query(
      `SELECT id, user_name, email, categories  FROM users WHERE id=$1`,
      [userId]
    );
    if (userInfoQuery.rowCount <= 0)
      return new ApiError(res, { statuscode: 404, message: "user not found" });
    const userInfo = userInfoQuery.rows[0];
    const userPostsQuery = await pool.query(
      `SELECT id, title, content,slug, user_id,created_at FROM posts WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    if (userPostsQuery.rowCount !== 0) {
      const postCountQuery = await pool.query(
        `SELECT COUNT(*) FROM posts WHERE user_id =$1`,
        [userId]
      );
      userPosts = userPostsQuery.rows[0];
      postCount = postCountQuery.rows[0];
    }
    console.log("fetched from normal db");
    const response = {
      data: { userInfo, userPosts },
      meta: { limit, page, offset, postCount: postCount?.count },
    };
    await client.setEx(cacheKey, 60, JSON.stringify(response));
    return sendResponse(res, response);
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const logout = async (req, res) => {
  try {
    const cookiesRefreshToken = req.cookies.refresh_token;
    if (cookiesRefreshToken)
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });

    await pool.query(
      `UPDATE users
   SET refresh_token = ARRAY[]::text[]
   WHERE id = $1`,
      [req.user.id]
    );

    return sendResponse(res, { message: "logged out successfully" });
  } catch (err) {
    return new ApiError(err, { message: err.message, errors: err }, err);
  }
};
