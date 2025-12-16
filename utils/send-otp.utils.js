import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import env from "../config/env.js";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "gwonpam@gmail.com",
    pass: "cqfi wxmw knhw asaz",
  },
});
const sendCode = async (email) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    const hashedCode = await bcrypt.hash(otp, 8);
    try {
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
      throw new Error("failed to send code");
    }
  } catch (error) {
    return error;
  }
};
export default sendCode;
