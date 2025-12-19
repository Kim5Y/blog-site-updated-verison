import { Server } from "socket.io";
import pool from "./db.config.js";
import env from "./env.js";
import jwt from "jsonwebtoken";
let io = null;

export const initSocket = (server, res) => {
  try {
    io = new Server(server, {
      cors: {
        origin: "*",
      },
    });
    io.on("connection", async (socket) => {
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.emit("tokenError", { message: "invalid token" });
        socket.disconnect();
      }
      let isValidUser;
      try {
        isValidUser = jwt.verify(token, env.ACCESS_TOKEN_SECRET);
      } catch (err) {
        if (err.name === "TokenExpiredError") {
          socket.emit("tokenExpired", { message: err.message });
        } else {
          socket.emit("unauthorized", { message: err.message });
        }
        console.log(err);
        return socket.disconnect();
      }
      const categories = await pool.query(
        "SELECT categories FROM users WHERE id=$1",
        [isValidUser.id]
      );
      const userCategories = categories.rows[0].categories;

      userCategories.forEach((category) => {
        socket.join(`category-${category}`);
      });
      socket.join(`user:${isValidUser.id}`);
      socket.on("join:post", ({ postId }) => {
        socket.join(`post:${postId}`);
      });
      socket.on("leave:post", ({ postId }) => {
        socket.leave(`post:${postId}`);
      });
      socket.on("join:comment", ({ postId }) => {
        socket.join(`comment:${postId}`);
      });
      socket.on("leave:comment", ({ postId }) => {
        socket.leave(`comment:${postId}`);
      });
      socket.on("join:reply", ({ postId, parentId }) => {
        socket.join(`reply:${postId}-${parentId}`);
      });
      socket.on("leave:reply", ({ postId, parentId }) => {
        socket.leave(`reply:${postId}-${parentId}`);
      });
      console.log(`${isValidUser.username} has joined: user${isValidUser.id}`);
      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });
    return io;
  } catch (err) {
    console.log(err);
    return io;
  }
};
