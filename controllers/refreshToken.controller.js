import sendResponse from "../utils/sendResponse.util.js";
import ApiError from "../utils/error.utils.js";
import bcrypt from "bcrypt";
import pool from "../config/db.config.js";
import env from "../config/env.js";
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/tokens.config.js";
export default async (req, res) => {
  try {
    const { refresh_token } = req.cookies;
    if (!refresh_token)return new ApiError(res, {status: 403, message: "invalid refresh token"});
    const userCookieRefreshToken = jwt.verify(
      refresh_token,
      env.REFRESH_TOKEN_SECRET
    );
    if (!userCookieRefreshToken)return new ApiError(res, {message: "invalid", statuscode: 401})
    console.log(userCookieRefreshToken);
    req.user = userCookieRefreshToken;
    console.log(req.user.id);
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.user.id,
    ]);
    const userPayload = user.rows[0];
    const userDBRefreshTokens = user.rows[0].refresh_token;
    let isValidToken = false;
    for (const refreshToken of userDBRefreshTokens) {
      const match = await bcrypt.compare(refresh_token, refreshToken);
      if (match) {
        isValidToken = refreshToken;
        break;
      }
    }
    await pool.query(
      `UPDATE users SET refresh_token = NULL WHERE id=${req.user.id}`
    );

    await pool.query(
      `UPDATE users SET refresh_token = array_append(refresh_token, $1) WHERE id = $2`,
      [isValidToken, req.user.id]
    );
    const accessToken = generateAccessToken({ id: userPayload.id });
   return sendResponse(res, { data: {token: accessToken} });
  } catch (err) {
    console.log(err);
    return new ApiError(res, {message: err.message, statuscode: 500}, err);
  }
};
//continue here asshole
//next up post creation
//and push recent commit
// ERROR HANDLING AND MESSAGE HANDLING ALSO
