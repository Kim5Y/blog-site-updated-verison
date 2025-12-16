import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import env from "../config/env.js";
// import pool from "../config/db.config.js";
const transporter = nodemailer.createTransport({
  host: env.MAIL_TRAP_HOST,
  port: env.MAIL_TRAP_PORT,
  auth: {
    user: env.MAIL_TRAP_USER,
    pass: env.MAIL_TRAP_PASSWORD,
  },
});
const sendCode = async (email) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    const hashedCode = await bcrypt.hash(otp, 8);
    const sendCodeTOEmail = await transporter.sendMail({
      from: env.MAILER_EMAIL,
      to: email,
      subject: "Your OTP Code from our blogging site",
      text: `Your verification code is ${otp}. It expires in 5 minutes.`,
    });
    if (sendCodeTOEmail) {
      return {
        hashedCode,
        expires,
      };
    }
  } catch (error) {
    return error;
  }
};
export default sendCode;
