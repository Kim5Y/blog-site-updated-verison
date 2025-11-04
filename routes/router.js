import express from "express";
import authenticationRouter from "./authentication.route.js";
import AccountsRouter from "./accounts.route.js";
import postRouter from "./post.route.js";
const router = express.Router();
router.use('/accounts', AccountsRouter);
router.use("/authentication", authenticationRouter);
router.use("/posts", postRouter);
export default router;