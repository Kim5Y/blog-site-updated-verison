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
        methods: ["GET", "POST", "PATCH"],
      },
    });
    io.on("connection", async (socket) => {
      console.log(" Socket connected:", socket.id);
      console.log(socket.handshake.auth.token);
      const token = socket.handshake.auth.token;
      if (!token) {
        socket.emit("tokenError", { message: "invalid token" });
        console.log("no token provided for the sockets");
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
      socket.join(`user:${isValidUser.id}`);
      console.log(`${isValidUser.username} has joined: user${isValidUser.id}`)
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
