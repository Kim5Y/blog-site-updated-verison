import jwt from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "./error.utils.js";
const SECRET_ACCESS_KEY = env.ACCESS_TOKEN_SECRET;
export default async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader)
      return new ApiError(res, {statuscode: 401, message: "invalid authentication header"});
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    if (!token)
      return new ApiError(res, { statuscode: 401, message: "invalid token" });
    try {
      const isValidUser = jwt.verify(token, SECRET_ACCESS_KEY);

      if (!isValidUser)
        return new ApiError(res, { statuscode: 401, message: "invalid token" });
      req.user = isValidUser;
    } catch (error) {
      return new ApiError(res, {
        statuscode: 401,
        message: "invalid token",
      });
    }
    next();
  } catch (err) {
    console.log(err);
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
