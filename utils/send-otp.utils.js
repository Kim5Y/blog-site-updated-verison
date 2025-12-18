import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import env from "../config/env.js";
// const transporter = nodemailer.createTransport({
//   host: "smtp.gmail.com",
//   port: 465,
//   secure: true,
//   auth: {
//     user: "gwonpam@gmail.com",
//     pass: "cqfi wxmw knhw asaz",
//   },
// });

import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

const mailerSend = new MailerSend({
  apiKey: env.MAIL_SEND_API_KEY,
});

const sentFrom = new Sender(
  "MS_SuPihr@test-51ndgwvqro5lzqx8.mlsender.net",
  "blogg-site"
);

const sendCode = async (email) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    const hashedCode = await bcrypt.hash(otp, 8);
    try {
      const recipients = [new Recipient(email)];
      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setReplyTo(sentFrom)
        .setSubject("OTP code from Our blogging site")
        .setHtml(
          `<strong>hYour verification code is ${otp}. It expires in 5 minutes. </strong>`
        )
        .setText("This is the text content");
      const sendCodeTOEmail = await mailerSend.email.send(emailParams);
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

//add this to the email config up there
