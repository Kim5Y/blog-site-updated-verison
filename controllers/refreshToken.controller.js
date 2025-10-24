import bcrypt from "bcrypt";
import pool from "../config/db.config.js";
import { generateAccessToken } from "../utils/tokens.config.js";
export default async (req, res) => {
  try {
    const { refresh_token } = req.cookies;
    if (!refresh_token)
      return res
        .status(403)
        .json({ error: true, message: "invalid refresh token" });

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
    return res.status(201).json({error: false, token: accessToken});
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: true,
      message: err.message,
      code: "INTERNAL SERVER ERROR",
    });
  }
};

//continue here asshole
