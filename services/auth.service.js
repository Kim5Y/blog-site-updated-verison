import pool from "../config/db.config.js";
import bcrypt from "bcrypt";
import { client } from "../config/redis.config.js";
import sendCode from "../utils/send-otp.utils.js";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import {
  generateAccessToken,
  generateRefreshToken,
  generateResetPasswordSessionToken,
} from "../utils/tokens.config.js";

const allowedCategories = [
  "tech",
  "lifestyle",
  "health",
  "travel",
  "food",
  "sports",
  "entertainment",
  "business",
  "education",
  "food",
  "fashion",
  "personal development",
  "News and current Events",
  "reviews",
  "photography",
  "parenting and Family",
];

export const sendOtp = async (userData) => {
  const { username, email, password, categories } = userData;

  const allValidCategories = categories.every((category) =>
    allowedCategories.includes(category),
  );

  if (!allValidCategories) {
    throw new Error("invalid category");
  }

  const usernameExists = await pool.query(
    "SELECT * FROM users WHERE user_name = $1 ",
    [username],
  );
  if (usernameExists.rowCount > 0) {
    throw new Error("invalid username");
  }

  const emailExists = await pool.query(
    "SELECT * FROM users WHERE email = $1 ",
    [email],
  );
  if (emailExists.rowCount > 0) {
    throw new Error(
      "Your search did not return any results. Please try again with other information.",
    );
  }

  const otpData = await sendCode(email);
  if (!otpData) {
    throw new Error("failed to send code");
  }

  const newUser = {
    username,
    password,
    otpData,
    categories,
  };

  const savedOtpData = await client.set(email, JSON.stringify(newUser), {
    EX: 360,
  });

  if (!savedOtpData) {
    throw new Error("failed to send OTP code");
  }

  return {
    message: `OTP code successfully sent to ${email}, expires in 6minutes`,
  };
};

export const verifyOtpAndCreateUser = async (data) => {
  const { email, otpCode } = data;

  const getDetails = await client.get(email);
  if (!getDetails) {
    throw new Error("OTP code has expired");
  }

  const userData = JSON.parse(getDetails);
  const otpCodeHasExpired = new Date(userData.otpData.expires) < new Date();

  if (otpCodeHasExpired) {
    throw new Error("OTP code has expired");
  }

  if (!(await bcrypt.compare(otpCode, userData.otpData.hashedCode))) {
    throw new Error("invalid OTP code");
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newValidUser = {
    user_name: userData.username,
    password_hash: hashedPassword,
    email: email,
    categories: userData.categories,
  };

  const query = `INSERT INTO users (user_name, password_hash, email, categories) VALUES ($1, $2, $3, $4) RETURNING id;`;
  const values = [
    newValidUser.user_name,
    newValidUser.password_hash,
    newValidUser.email,
    newValidUser.categories,
  ];

  const result = await pool.query(query, values);
  const id = result.rows[0];

  const payload = {
    id: id.id,
    user_name: newValidUser.user_name,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const hashedRefreshedToken = await bcrypt.hash(refreshToken, 8);

  await pool.query(
    `UPDATE users SET refresh_token = array_append(refresh_token, $1) WHERE email = $2`,
    [hashedRefreshedToken, email],
  );

  await client.del(email);

  return { accessToken, refreshToken, categories: userData.categories };
};

export const loginUser = async (loginData) => {
  const { email, password } = loginData;

  const isUserExists = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email],
  );

  if (isUserExists.rowCount <= 0) {
    throw new Error("user not found");
  }

  const user = isUserExists.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error("incorrect password");
  }

  const payload = {
    id: user.id,
    username: user.user_name,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  const hashedRefreshedToken = await bcrypt.hash(refreshToken, 8);

  await pool.query(
    `UPDATE users SET refresh_token = array_append(refresh_token, $1) WHERE email = $2`,
    [hashedRefreshedToken, email],
  );

  return { accessToken, refreshToken };
};

export const refreshAccessToken = async (tokenObj) => {
  const { refresh_token } = tokenObj;

  if (!refresh_token) throw new Error("invalid refresh token");

  const userCookieRefreshToken = jwt.verify(
    refresh_token,
    env.REFRESH_TOKEN_SECRET,
  );

  if (!userCookieRefreshToken) throw new Error("invalid");

  const user = await pool.query("SELECT * FROM users WHERE id = $1", [
    userCookieRefreshToken.id,
  ]);

  if (user.rowCount === 0) throw new Error("User not found");

  const userPayload = user.rows[0];
  const userDBRefreshTokens = user.rows[0].refresh_token;
  let isValidToken = null;

  if (userDBRefreshTokens) {
    for (const token of userDBRefreshTokens) {
      const match = await bcrypt.compare(refresh_token, token);
      if (match) {
        isValidToken = token;
        break;
      }
    }
  }

  if (!isValidToken) throw new Error("Invalid refresh token");

  await pool.query(`UPDATE users SET refresh_token = NULL WHERE id=$1`, [
    userCookieRefreshToken.id,
  ]);


  await pool.query(
    `UPDATE users SET refresh_token = array_append(refresh_token, $1) WHERE id = $2`,
    [isValidToken, userCookieRefreshToken.id],
  );

  const accessToken = generateAccessToken({ id: userPayload.id });
  return { accessToken };
};

export const sendPasswordResetOtp = async (email) => {
  const emailExists = await pool.query(
    "SELECT email FROM users WHERE email=$1",
    [email],
  );
  if (emailExists.rowCount === 0) {
    throw new Error(
      "Your search did not return any results. Please try again with other information.",
    );
  }

  const otpData = await sendCode(email);
  if (!otpData) {
    throw new Error("failed to send code");
  }

  const payload = { email };
  const sessionToken = generateResetPasswordSessionToken(payload);

  await client.setEx(email, 360, JSON.stringify(otpData));

  return { sessionToken, email };
};

export const verifyPasswordOtp = async (data) => {
  const { email, otpCode, sessionToken } = data;


  const session = jwt.verify(sessionToken, env.REFRESH_TOKEN_SECRET);
  if (!session) throw new Error("invalid session id");


  const getCodeDataFromCache = await client.get(email);
  if (!getCodeDataFromCache) throw new Error("otp code has expired");

  const codeData = JSON.parse(getCodeDataFromCache);
  const otpCodeHasExpired = new Date(codeData.expires) < new Date();

  if (otpCodeHasExpired) throw new Error("OTP code has expired");

  const otpCodeStr = String(otpCode).trim();
  if (!(await bcrypt.compare(otpCodeStr, codeData.hashedCode))) {
    throw new Error("invalid OTP code");
  }

  return true;
};

export const resetPassword = async (data) => {
  const { password, sessionToken } = data;

  const session = jwt.verify(sessionToken, env.REFRESH_TOKEN_SECRET);
  if (!session) throw new Error("invalid");

  const email = session.email;
  const recentPasswordQuery = await pool.query(
    `SELECT password_hash FROM users WHERE email=$1`,
    [email],
  );
  const recentPassword = recentPasswordQuery.rows[0].password_hash;
  const passwordIsTheSame = await bcrypt.compare(password, recentPassword);

  if (passwordIsTheSame) {
    throw new Error("new password can not be theSame as the old password");
  }

  const newHashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    `UPDATE users SET password_hash = $1, refresh_token=NULL WHERE email=$2`,
    [newHashedPassword, email],
  );


  await pool.query(`UPDATE users SET password_hash = $1`, [newHashedPassword]);

  return true;
};

export const sendEmailUpdateOtp = async (inputEmail) => {
  const emailExists = await pool.query(
    "SELECT email FROM users WHERE email=$1",
    [inputEmail],
  );
  if (emailExists.rowCount !== 0) {
    throw new Error("new email can not be thesame as the recent email");
  }

  const otpData = await sendCode(inputEmail);
  if (!otpData) throw new Error("failed to send code");

  await client.setEx(inputEmail, 360, JSON.stringify(otpData));

  return { email: inputEmail };
};

export const verifyEmailUpdateOtp = async (data) => {
  const { otpCode, email, userId } = data;

  const otpData = await client.get(email);
  if (!otpData) throw new Error("otp code has expired");

  const codeData = JSON.parse(otpData);
  const otpCodeHasExpired = new Date(codeData.expires) < new Date();

  if (otpCodeHasExpired) throw new Error("OTP code has expired");

  const otpCodeStr = String(otpCode).trim();

  if (!(await bcrypt.compare(otpCodeStr, codeData.hashedCode))) {
    throw new Error("invalid OTP code");
  }

  const updateEmail = await pool.query(
    "UPDATE users SET email=$1 WHERE id=$2",
    [email, userId],
  );

  if (updateEmail.rowCount == 0) throw new Error("faild to update email");

  return email;
};
