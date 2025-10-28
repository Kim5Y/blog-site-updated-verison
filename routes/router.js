import express from "express";
import authenticationRouter from "./authentication.route.js";
import AccountsRouter from "./accounts.route.js";
const router = express.Router();
router.use('/accounts', AccountsRouter);
router.use("/authentication", authenticationRouter);
export default router;