import { Pool } from "pg";
import env from "./env.js";
let pool;
if (env.NODE_ENV === "production") {
  pool = new Pool({
    // host: env.NEON_HOST,
    // database: env.NEON_DATABASE,
    // user: env.NEON_USER,
    // password: env.NEON_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    connectionString: env.PG_DATABASE_URL,
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
pool.on("error", (err) => {
  console.log("postgres error:", err);
});
export default pool;
