import { Server } from "socket.io";
import pool from "./db.config.js";

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
    if (req.user.id) return console.log("user is a stranger");
    const userCategory = await pool.query(
      "SELECT categories FROM categories WHERE user_id=$1",
      [req.user.id]
    );
    console.log(userCategory.rows[0]);
    //  socket.on("joinCategory", (categoryId) => {
    //     socket.join(`category-${categoryId}`);
    //     console.log(`📚 User joined category ${categoryId}`);
    //   });
    socket.join();
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return io;
};
// export const getIO = () => {
//   if (!io) throw new Error("Socket.io not initialized!");
//   return io;
// };
