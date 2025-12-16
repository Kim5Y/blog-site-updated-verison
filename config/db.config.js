import { Pool } from "pg";
import env from "./env.js";
let pool;
if (env.NODE_ENV === "production") {
  pool = new Pool({
    host: env.NEON_HOST,
    database: env.NEON_DATABASE,
    user: env.NEON_USER,
    password: env.NEON_PASSWORD,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  });
} else {
  pool = new Pool({
    user: env.PG_USER,
    host: env.PG_HOST,
    database: env.PG_DATABASE,
    password: env.PG_PASSWORD,
    port: env.PG_PORT,
  });
}
export default pool;