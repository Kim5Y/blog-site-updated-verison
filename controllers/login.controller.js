import pool from "../config/db.config.js";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/tokens.config.js";
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ error: true, message: "email or password cannot be empty" });
    const isUserExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    console.log(isUserExists.rows[0]);
    if (isUserExists.rowCount <= 0)
      return res.status(404).json({ error: true, message: "user not found" });
    const user = isUserExists.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword)
      res.status(400).json({ error: true, message: "incorrect password" });
    const payload = {
      id: user.id,
      username: user.user_name,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    await pool.query(
      `UPDATE users SET refresh_token = array_append(refresh_token, $1) WHERE email = $2`,
      [refreshToken, email]
    );
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true, //this may be the issue
      sameSite: "strict",
    });
    return res.status(201).json({ error: false, token: accessToken });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: true,
      message: err.message,
      code: "INTERNAL SERVER ERROR",
    });
  }
};
