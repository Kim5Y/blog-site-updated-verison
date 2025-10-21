import express from "express";
import { sendOtp, verifyOtp } from "../controllers/createAccount.controller.js";
import {
  createAccountValidation,
  verifyOtpValidator,
} from "../middlewares/createAccValidation.middleware.js";
const authRouter = express.Router();
authRouter.post("/send-otp", createAccountValidation, sendOtp);
authRouter.post("/verify-otp", verifyOtpValidator, verifyOtp);
export default authRouter;


/*
userData = {
  username: 'ibrahimPam3',
  password: 'passworD1@@',
  otpData: { code: '966286', expires: '2025-10-21T09:57:45.285Z' }
}
*/