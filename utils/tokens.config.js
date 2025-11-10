import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const generateAccessToken = (id) => {
  return jwt.sign(id, env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
};

export const generateRefreshToken = (id) => {
  return jwt.sign(id, env.REFRESH_TOKEN_SECRET, { expiresIn: "30day" });
};
