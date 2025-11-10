import { Server } from "socket.io";
import pool from "./db.config.js";
// import verifyUser from "../utils/verifyUser.utils.js";
import env from "./env.js";
import jwt from "jsonwebtoken";
let io = null;

export const initSocket = async (server) => {
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
      console.log("error from socket io: invalid token");
      return socket.disconnect();
    }

    const isValidUser = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
    if (!isValidUser) {
      console.log("error from socket io: invalid or expired token");
      return socket.disconnect();
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
      console.log(`user {${isValidUser.user_name}} has joined:`,category);
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};
