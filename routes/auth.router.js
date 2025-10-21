import express from "express";
import { sendOtp, verifyOtp } from "../controllers/createAccount.controller.js";
import { login } from "../controllers/login.controller.js";
import {
  createAccountValidation,
  verifyOtpValidator,
  loginValidator,
} from "../middlewares/createAccValidation.middleware.js";
const authRouter = express.Router();
authRouter.post("/send-otp", createAccountValidation, sendOtp);
authRouter.post("/verify-otp", verifyOtpValidator, verifyOtp);
authRouter.post("/login", loginValidator, login);
export default authRouter;