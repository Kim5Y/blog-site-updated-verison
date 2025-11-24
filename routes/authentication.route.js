import express from "express";
import refreshTokenController from "../controllers/refreshToken.controller.js";
import {
  strictLimiter,
  mediumLimiter,
  flexibleLimiter,
} from "../config/rateLimit.config.js";

import {
  createAccountValidation,
  verifyOtpValidator,
  loginValidator,
  validateEditProfile,
} from "../middlewares/createAccount.middleware.js";
import { sendOtp, verifyOtp } from "../controllers/createAccount.controller.js";
import { login } from "../controllers/login.controller.js";
import verifyUser from "../utils/verifyUser.utils.js";
import userProfileController, {
  logout,
} from "../controllers/userProfile.controller.js";
import edithProfileController from "../controllers/edithProfile.controller.js";
import changePasswordController, {
  sendResetEmailOtp,
  resetPassword,
  verifyPasswordOtp,
  verifyEmailResetOtp,
} from "../controllers/changePassword.controller.js";

const authenticationRouter = express.Router();
authenticationRouter.post("/refresh", flexibleLimiter, refreshTokenController);
authenticationRouter.post(
  "/create-account/otp",
  strictLimiter,
  createAccountValidation,
  sendOtp
);
authenticationRouter.post(
  "/create-account/verify",
  strictLimiter,
  verifyOtpValidator,
  verifyOtp
);
authenticationRouter.post("/login", strictLimiter, login);
authenticationRouter.get(
  "/profile/:id",
  flexibleLimiter,
  verifyUser,
  userProfileController
);
authenticationRouter.patch(
  "/profile",
  flexibleLimiter,
  validateEditProfile,
  verifyUser,
  edithProfileController
);
authenticationRouter.post("/logout", flexibleLimiter, verifyUser, logout);
authenticationRouter.post(
  "/password-reset/otp",
  strictLimiter,
  changePasswordController
);
authenticationRouter.post(
  "/password-reset/verify",
  strictLimiter,
  verifyPasswordOtp
);
authenticationRouter.put(
  "/password-reset/complete",
  strictLimiter,
  resetPassword
);
authenticationRouter.post(
  "/email-reset/otp",
  strictLimiter,
  verifyUser,
  sendResetEmailOtp
);
authenticationRouter.put(
  "/email-reset/complete",
  strictLimiter,
  verifyUser,
  verifyEmailResetOtp
);
export default authenticationRouter;
