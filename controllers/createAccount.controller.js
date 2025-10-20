import bcrypt from "bcrypt";
import { client } from "../config/redis.config.js";
import sendCode from "../utils/send-otp.utils.js";
import pool from "../config/db.config.js";
import validateEmail from "../utils/email-validator.utils.js";
export const sendOtp = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res
        .status(400)
        .json({ error: true, message: "input fields cannot be empty" });

    const usernameExists = await pool.query(
      "SELECT * FROM users WHERE user_name = $1 ",
      [username]
    );
    if (usernameExists.rowCount > 0)
      return res.status(400).json({ error: true, message: "invalid username" });
    const emailExists = await pool.query(
      "SELECT * FROM users WHERE email = $1 ",
      [email]
    );
    if (emailExists.rowCount > 0)
      return res
        .status(400)
        .json({ error: true, message: "invalid credentials" });

    const emailResponse = await validateEmail(email);
    const isValidEmail = await emailResponse.data.email_risk
      .address_risk_status;
    // console.log(isValidEmail)
    if (isValidEmail === "high")
      return res.status(400).json({
        error: true,
        message: "invalid email, try another email address",
      });
    const otpData = await sendCode(email);
    const savedOtpData = await client.set(email, JSON.stringify(otpData), {
      EX: 360,
    });
    if (savedOtpData) {
      return res.status(201).json({
        error: false,
        message: `OTP code successfully sent to ${email}, expires in 6minutes`,
      });
    }else{
      return res.status(404).json({error: true, message: "failed to send otp code"})
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: true,
      message: err.message,
      code: "INTERNAL SERVER ERROR",
    });
  }
};
export const verifyOtp = async (req, res) => {
  try {
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      error: true,
      message: err.message,
      code: "INTERNAL SERVER ERROR",
    });
  }
};
