import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import bcrypt from "bcrypt";
import { client } from "../config/redis.config.js";
import sendCode from "../utils/send-otp.utils.js";
import pool from "../config/db.config.js";
import jwt from "jsonwebtoken";
import { generateResetPasswordSessionToken } from "../utils/tokens.config.js";
import env from "../config/env.js";
export default async (req, res) => {
  try {
    let { email } = req.body;
    if (!email || typeof email !== "string")
      return new ApiError(res, {
        message: "email cannot be empty",
        statuscode: 400,
      });
    email = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return new ApiError(res, {
        message: "invalid email format",
        statuscode: 400,
      });
    const emailExists = await pool.query(
      "SELECT email FROM users WHERE email=$1",
      [email]
    );
    if (emailExists.rowCount === 0)
      return new ApiError(res, {
        message:
          "Your search did not return any results. Please try again with other information.",
        statuscode: 400,
      });
    const otpData = await sendCode(email);
    console.log(otpData);
    if (!otpData)
      return new ApiError(res, {
        message: "failed to send code",
        statuscode: 500,
      });
    const payload = { email };
    const sessionToken = generateResetPasswordSessionToken(payload);
    res.cookie("session_token", sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    await client.setEx(email, 360, JSON.stringify(otpData));
    return sendResponse(res, {
      message: `OTP code successfully sent to ${email}, expires in 6minutes`,
      statusCodes: 200,
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const verifyPasswordOtp = async (req, res) => {
  try {
    let { email, otpCode } = req.body;
    const sessionToken = req.cookies.session_token;
    if (!email || typeof email !== "string")
      return new ApiError(res, {
        message: "email cannot be empty",
        statuscode: 400,
      });
    if (!sessionToken)
      return new ApiError(res, {
        message: "session key not found",
        statuscode: 404,
      });
    if (typeof otpCode !== "number")
      return new ApiError(res, {
        message: "invalid otp code",
        statuscode: 400,
      });
    email = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return new ApiError(res, {
        message: "invalid email format",
        statuscode: 400,
      });
    const otpCodeStr = String(otpCode).trim();
    if (!/^\d+$/.test(otpCodeStr))
      return new ApiError(res, {
        message: "OTP code must contain only digits",
        statuscode: 400,
      });

    if (otpCodeStr.length < 4 || otpCodeStr.length > 6)
      return new ApiError(res, {
        message: "OTP code must be 4-6 digits",
        statuscode: 400,
      });
    const session = jwt.verify(sessionToken, env.REFRESH_TOKEN_SECRET);
    if (!session)
      return new ApiError(res, {
        message: "invalid session id",
        statuscode: 400,
      });
    const getCodeDataFromCache = await client.get(email);
    if (!getCodeDataFromCache)
      return new ApiError(res, {
        message: "otp code has expired",
        statuscode: 404,
      });
    const codeData = JSON.parse(getCodeDataFromCache);

    const otpCodeHasExpired = new Date(codeData.expires) < new Date();
    if (otpCodeHasExpired)
      return new ApiError(res, {
        message: "OTP code has expired",
        statuscode: 400,
      });
    console.log({ codeData: codeData.hashedCode });
    console.log({ otpCode });
    if (!(await bcrypt.compare(otpCodeStr, codeData.hashedCode)))
      return new ApiError(res, {
        statuscode: 400,
        message: "invalid OTP code",
      });
    return res.sendStatus(200);
  } catch (err) {
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const sessionToken = req.cookies.session_token;
    if (!sessionToken)
      return new ApiError(res, {
        message: "session key not found",
        statuscode: 404,
      });
    if (!password)
      return new ApiError(res, {
        message: "password input cannot be empty",
        statuscode: 400,
      });
    const minLength = 8;

    if (password.length < minLength) {
      return {
        valid: false,
        message: "Password must be at least 8 characters long.",
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one uppercase letter.",
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one lowercase letter.",
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one number.",
      };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one special character.",
      };
    }
    const session = jwt.verify(sessionToken, env.REFRESH_TOKEN_SECRET);
    if (!session)
      return new ApiError(res, { message: "invalid", statuscode: 401 });
    console.log(session);
    const email = session.email;
    const recentPasswordQuery = await pool.query(
      `SELECT password_hash FROM users WHERE email=$1`,
      [email]
    );
    const recentPassword = recentPasswordQuery.rows[0].password_hash;
    const passwordIsTheSame = await bcrypt.compare(password, recentPassword);
    if (passwordIsTheSame)
      return new ApiError(res, {
        message: "new password can not be theSame as the old password",
        statuscode: 400,
      });

    const newHashedPassword = await bcrypt.hash(password, 10);
    await pool.query(`UPDATE users SET password_hash = $1`, [
      newHashedPassword,
    ]);
    res.clearCookie("session_token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    return sendResponse(res, { message: "password updated", statusCodes: 201 });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const sendResetEmailOtp = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email || typeof email !== "string")
      return new ApiError(res, {
        message: "email cannot be empty",
        statuscode: 400,
      });
    email = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return new ApiError(res, {
        message: "invalid email format",
        statuscode: 400,
      });
    const emailExists = await pool.query(
      "SELECT email FROM users WHERE email=$1",
      [email]
    );
    if (emailExists.rowCount !== 0)
      return new ApiError(res, {
        message: "new email can not be thesame as the recent email",
        statuscode: 400,
      });
    const otpData = await sendCode(email);
    console.log(otpData);
    if (!otpData)
      return new ApiError(res, {
        message: "failed to send code",
        statuscode: 500,
      });
    await client.setEx(email, 360, JSON.stringify(otpData));
    res.cookie("new_email", email, {
      httpOnly: true,
      secure: false, //commot this line
      sameSite: "strict",
    });
    return sendResponse(res, {
      message: `OTP code successfully sent to ${email}, expires in 6minutes`,
      statusCodes: 200,
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const verifyEmailResetOtp = async (req, res) => {
  try {
    const { otpCode } = req.body;
    const email = req.cookies.new_email;
    const userId = req.user.id;
    if (!email)
      return new ApiError(res, { message: "email not found", statuscode: 404 });
    if (!otpCode)
      return new ApiError(res, {
        message: "input cannot be empty",
        statuscode: 400,
      });
    const OTP = parseInt(otpCode);
    if (isNaN(OTP))
      return new ApiError(res, {
        message: "invalid otp code",
        statuscode: 400,
      });

    const otpCodeStr = String(otpCode).trim();
    if (!/^\d+$/.test(otpCodeStr))
      return new ApiError(res, {
        message: "OTP code must contain only digits",
        statuscode: 400,
      });

    if (otpCodeStr.length < 4 || otpCodeStr.length > 6)
      return new ApiError(res, {
        message: "OTP code must be 4-6 digits",
        statuscode: 400,
      });
    const otpData = await client.get(email);
    if (!otpData)
      return new ApiError(res, {
        message: "otp code has expired",
        statuscode: 404,
      });

    const codeData = JSON.parse(otpData);
    const otpCodeHasExpired = new Date(codeData.expires) < new Date();
    if (otpCodeHasExpired)
      return new ApiError(res, {
        message: "OTP code has expired",
        statuscode: 400,
      });
    if (!(await bcrypt.compare(otpCodeStr, codeData.hashedCode)))
      return new ApiError(res, {
        statuscode: 400,
        message: "invalid OTP code",
      });

    const updateEmail = await pool.query(
      "UPDATE users SET email=$1 WHERE id=$2",
      [email, userId]
    );
    if (updateEmail.rowCount == 0)
      return new ApiError(res, {
        message: "faild to update email",
        statuscode: 500,
      });
    return sendResponse(res, {
      message: "email updated  successfully",
      statusCodes: 201,
      data: email,
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
