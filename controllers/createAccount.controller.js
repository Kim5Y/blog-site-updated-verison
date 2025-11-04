import bcrypt from "bcrypt";
import { client } from "../config/redis.config.js";
import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import sendCode from "../utils/send-otp.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokens.config.js";
import pool from "../config/db.config.js";
import validateEmail from "../utils/email-validator.utils.js";
export const sendOtp = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return new ApiError(res, {
        statuscode: 400,
        message: "input field cannot be empty",
      });
    if (await client.get(email)) await client.del(email);
    const usernameExists = await pool.query(
      "SELECT * FROM users WHERE user_name = $1 ",
      [username]
    );
    if (usernameExists.rowCount > 0)
      return new ApiError(res, {
        statuscode: 400,
        message: "invalid username",
      });
    const emailExists = await pool.query(
      "SELECT * FROM users WHERE email = $1 ",
      [email]
    );
    if (emailExists.rowCount > 0)
      return new ApiError(res, {
        message: "invalid email address please use another email address",
        statuscode: 400,
      });
    // const emailResponse = await validateEmail(email);
    // const isValidEmail = await emailResponse.data.email_risk
    //   .address_risk_status;
    // if (isValidEmail === "high")
    //   return res.status(422).json({
    //     error: true,
    //     message: "invalid email, try another email address",
    //   });
    const otpData = await sendCode(email);
    console.log(otpData);
    const newUser = {
      username,
      password,
      otpData,
    };
    const savedOtpData = await client.set(email, JSON.stringify(newUser), {
      EX: 360,
    });
    if (!savedOtpData)
      return new ApiError(res, {
        message: "failed to send OTP code",
        statuscode: 404,
      });
    return sendResponse(res, {
      message: `OTP code successfully sent to ${email}, expires in 6minutes`,
      statusCodes: 201,
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, {
      statuscode: 500,
      message: err.message,
      errors: err,
    }, err);
  }
};
export const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode)
      return new ApiError(res, {
        statuscode: 400,
        message: "input cannot be empty",
      });
    const getDetails = await client.get(email);
    if (!getDetails)
      return new ApiError(res, {
        message: "OTP code has expired ",
        statuscode: 401,
      });
    const userData = JSON.parse(getDetails);
    const otpCodeHasExpired = new Date(userData.otpData.expires) < new Date();
    if (otpCodeHasExpired)
      return new ApiError(res, {
        message: "OTP code has expired",
        statuscode: 401,
      });
    if (otpCode !== userData.otpData.code)
      return new ApiError(res, {
        statuscode: 400,
        message: "invalid OTP code",
      });
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newValidUser = {
      user_name: userData.username,
      password_hash: hashedPassword,
      email: email,
    };
    const query = `INSERT INTO users (user_name, password_hash, email) VALUES ($1, $2, $3) RETURNING id;`;
    const values = [
      newValidUser.user_name,
      newValidUser.password_hash,
      newValidUser.email,
    ];
    const result = await pool.query(query, values);
    // if (result.rowCount <= 0)
    //   return res
    //     .status(500)
    //     .json({ error: true, message: "fail to add user to db" });
    const id = result.rows[0];
    const accessToken = generateAccessToken(id);
    const refreshToken = generateRefreshToken(id);
    const hashedRefreshedToken = await bcrypt.hash(refreshToken, 8);
    await pool.query(
      `UPDATE users SET refresh_token = array_append(refresh_token, $1) WHERE email = $2`,
      [hashedRefreshedToken, email]
    );
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    await client.del(email);
    return sendResponse(res, {
      statusCodes: 201,
      message: "user successfully created",
      data: { token },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: true,
      message: err.message,
      code: "INTERNAL SERVER ERROR",
    }, err);
  }
};
