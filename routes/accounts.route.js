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
const AccountsRouter = express.Router();
AccountsRouter.post("/send-otp", createAccountValidation, sendOtp);
AccountsRouter.post("/verify-otp", verifyOtpValidator, verifyOtp);
AccountsRouter.post("/login", loginValidator, login);
AccountsRouter.post("/refresh", verifyUser, refreshTokens);
export default AccountsRouter;
