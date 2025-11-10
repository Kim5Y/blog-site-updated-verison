import pool from "../config/db.config.js";
import bcrypt from "bcrypt";
import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokens.config.js";
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return new ApiError(res, {
        message: "All input fields cannot be empty",
        statuscode: 400,
      });
    const isUserExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (isUserExists.rowCount <= 0)
      return new ApiError(res, { statuscode: 404, message: "user not found" });
    const user = isUserExists.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword)
      return new ApiError(res, {
        statuscode: 400,
        message: "incorrect password",
      });
    const payload = {
      id: user.id,
      username: user.user_name,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    const hashedRefreshedToken = await bcrypt.hash(refreshToken, 8);
    await pool.query(
      `UPDATE users SET refresh_token = array_append(refresh_token, $1) WHERE email = $2`,
      [hashedRefreshedToken, email]
    );
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false, //commot this line
      sameSite: "strict",
    });
    return sendResponse(res, {
      statusCodes: 200,
      data: { token: accessToken },
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res,{
      message: err.message,
      statuscode: 500,
    }, err);
  }
};
