import express from "express";
import { sendOtp, verifyOtp } from "../controllers/createAccount.controller.js";
import { login } from "../controllers/login.controller.js";
import refreshTokens from "../controllers/refreshToken.controller.js";
import verifyUser from "../utils/verifyUser.utils.js";
import {
  createAccountValidation,
  verifyOtpValidator,
  loginValidator,
} from "../middlewares/createAccValidation.middleware.js";
const authRouter = express.Router();
authRouter.post("/send-otp", createAccountValidation, sendOtp);
authRouter.post("/verify-otp", verifyOtpValidator, verifyOtp);
authRouter.post("/login", loginValidator, login);
authRouter.post("/refresh", verifyUser, refreshTokens);
export default authRouter;
