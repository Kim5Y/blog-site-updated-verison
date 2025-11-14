import express from "express";
import refreshTokenController from "../controllers/refreshToken.controller.js";
import {
  createAccountValidation,
  verifyOtpValidator,
  loginValidator,
} from "../middlewares/createAccount.middleware.js";
import { sendOtp, verifyOtp } from "../controllers/createAccount.controller.js";
import { login } from "../controllers/login.controller.js";
import verifyUser from "../utils/verifyUser.utils.js";
import userProfileController from "../controllers/userProfile.controller.js";
const authenticationRouter = express.Router();
authenticationRouter.post("/refresh", refreshTokenController);
authenticationRouter.post("/send-otp", createAccountValidation, sendOtp);
authenticationRouter.post("/verify-otp", verifyOtpValidator, verifyOtp);
authenticationRouter.post("/login", loginValidator, login);
authenticationRouter.get("/profile/:id", verifyUser, userProfileController);
export default authenticationRouter;