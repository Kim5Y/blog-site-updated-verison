import { createClient } from "redis";
import env from "./env.js";
export const client = createClient({
  username: "default",
  password: env.REDIS_PASSWORD,
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});
client
  .connect()
  .then(() => console.log("redis connected successfully"))
  .catch((error) => console.log(error));
