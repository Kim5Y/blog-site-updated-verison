import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import env from "../config/env.js";
import { Resend } from "resend";

const generateCode = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000);
  return { otp, expires };
};

const sendCode = async (email) => {
  const otp = generateCode().otp;
  const expires = generateCode().expires;
  const hashedCode = await bcrypt.hash(otp, 8);
  const resend = new Resend(env.RESEND_API_KEY);
  try {
    resend.emails.send({
      from: "Ourbloggsite@resend.dev",
      to: email,
      subject: "Your OTP Code from our blogging site",
      html: `<p>
  Use the verification code below to continue:
</p>
<h2 style="letter-spacing: 2px;">${otp}</h2>
<p>
  This code expires in 5 minutes.
</p>
`,
    });
    return {
      hashedCode,
      expires,
    };
  } catch (error) {
    return error;
  }
};

// import pool from "../config/db.config.js";
// const transporter = nodemailer.createTransport({
//   host: "smtp.ethereal.email",
//   port: 587,
//   secure: false,
//   auth: {
//     user: env.MAILER_EMAIL,
//     pass: env.MAILER_PASSWORD,
//   },
// });
// const sendCode = async (email) => {
//   try {
//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const expires = new Date(Date.now() + 5 * 60 * 1000);
//     const hashedCode = await bcrypt.hash(otp, 8);
//     try {
//       const sendCodeTOEmail = await transporter.sendMail({
//         from: env.MAILER_EMAIL,
//         to: email,
//         subject: "Your OTP Code from our blogging site",
//         text: `Your verification code is ${otp}. It expires in 5 minutes.`,
//       });
//       if (sendCodeTOEmail) {
//         return {
//           hashedCode,
//           expires,
//         };
//       }
//     } catch (error) {
//       throw new Error("failed to send code");
//     }
//   } catch (error) {
//     return error;
//   }
// };
export default sendCode;
