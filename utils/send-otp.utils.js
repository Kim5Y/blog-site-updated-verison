import bcrypt from "bcrypt";
import env from "../config/env.js";
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
          `<strong>Your verification code is ${otp}. It expires in 5 minutes. </strong>`
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
export default sendCode;
