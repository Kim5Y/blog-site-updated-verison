import { Server } from "socket.io";
import pool from "./db.config.js";
// import verifyUser from "../utils/verifyUser.utils.js";
import ApiError from "../utils/error.utils.js";
import env from "./env.js";
import jwt from "jsonwebtoken";
let io = null;

export const initSocket = async (server, res) => {
  try {
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    io.on("connection", async (socket) => {
      console.log(" Socket connected:", socket.id);
      console.log(socket.handshake.auth.token);
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.disconnect();
        throw new Error("error from socket io: invalid token");
      }
      let isValidUser;
      try {
        isValidUser = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
      } catch (err) {
        socket.disconnect();
        return new ApiError(
          res,
          { message: err.message, statuscode: 401, errors: err },
          err
        );
      }

      console.log(isValidUser);
      const categories = await pool.query(
        "SELECT categories FROM users WHERE id=$1",
        [isValidUser.id]
      );
      const userCategories = categories.rows[0].categories;
      console.log(userCategories);

      userCategories.forEach((category) => {
        socket.join(`category-${category}`);
        console.log(`user {${isValidUser.username}} has joined:`, category);
      });
      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });
    return io;
  } catch (err) {
    console.log(err);
    return new ApiError(
      res,
      { statuscode: 401, message: err.message, errors: err },
      err
    );
  }
};