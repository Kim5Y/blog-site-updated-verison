import jwt from "jsonwebtoken";
import env from "../config/env.js";
import bcrypt from "bcrypt";
import pool from "../config/db.config.js";
import ApiError from "./error.utils.js";

const SECRET_ACCESS_KEY = env.ACCESS_TOKEN_SECRET;

export default async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return new ApiError(res, {
        statuscode: 401,
        message: "invalid authentication header",
      });
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;

    if (!token)
      return new ApiError(res, { statuscode: 401, message: "invalid token" });

    try {
      const isValidUser = jwt.verify(token, SECRET_ACCESS_KEY);
      if (!isValidUser)
        return new ApiError(res, { statuscode: 401, message: "invalid token" });

      const { rows } = await pool.query(
        `SELECT refresh_token FROM users WHERE id=$1`,
        [isValidUser.id]
      );

      if (!rows || rows.length === 0)
        return new ApiError(res, {
          statuscode: 401,
          message: "user not found",
        });

      const storedTokens = rows[0].refresh_token;
      let isValid = false;
      if (refreshToken && Array.isArray(storedTokens)) {
        for (const hashedToken of storedTokens) {
          if (await bcrypt.compare(refreshToken, hashedToken)) {
            isValid = true;
            break;
          }
        }
      }
      if (isValid == false)
        return new ApiError(res, {
          statuscode: 401,
          message: "invalid refresh token",
        });
      req.user = isValidUser;
      next();
    } catch (error) {
      console.error(error);
      return new ApiError(res, {
        statuscode: 401,
        message: "invalid token",
      });
    }
  } catch (err) {
    console.error(err);
    return new ApiError(
      res,
      {
        statuscode: 500,
        message: err.message,
        errors: err,
      },
      err
    );
  }
};
