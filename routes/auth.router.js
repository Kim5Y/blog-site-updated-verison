import express from "express";
import { sendOtp, verifyOtp } from "../controllers/createAccount.controller.js";
import userInputValidation from "../middlewares/createAccValidation.middleware.js";
const authRouter = express.Router();
authRouter.post("/send-otp", userInputValidation, sendOtp);
authRouter.post("/verify-otp", verifyOtp);
export default authRouter;
