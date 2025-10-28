import express from "express";
import refreshTokenController from "../controllers/refreshToken.controller.js";
const authenticationRouter = express.Router();
authenticationRouter.post("/refresh", refreshTokenController);
export default authenticationRouter;
