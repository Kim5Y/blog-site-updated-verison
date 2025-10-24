import jwt from "jsonwebtoken";
import env from "../config/env.js";
const SECRET_ACCESS_KEY = env.ACCESS_TOKEN_SECRET;
export default async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
     if (!authHeader)
      return res
        .status(401)
        .json({ error: true, message: "invalid authHeader" });
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : authHeader;
    if (!token)
      return res.status(401).json({ error: true, message: "invalid token" });
    try {
      const isValidUser = jwt.verify(token, SECRET_ACCESS_KEY);

      if (!isValidUser)
        return res.status(401).json({ error: true, message: "invalid token" });
      req.user = isValidUser;
    } catch (error) {
      return res.status(401).json({
        error: true,
        message: "invalid token",
      });
    }
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: true,
      message: err.message,
      code: "INTERNAL SERVER ERROR",
    });
  }
};