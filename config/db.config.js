import { Pool } from "pg";
import env from "./env.js";

const poolConfig =
  env.NODE_ENV === "production"
    ? {
        min: 0,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        connectionString: env.PG_DATABASE_URL,
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {
        user: env.PG_USER,
        host: env.PG_HOST,
        database: env.PG_DATABASE,
        password: env.PG_PASSWORD,
        port: env.PG_PORT,
      };

const pool = new Pool(poolConfig);
pool.on("error", (err) => {
  console.log("postgres error:", err);
});

try {
  const connect = await pool.query(`SELECT NOW()`);
  console.log("database connected successfully:", connect.rows[0]);
} catch (error) {
  console.log("initial database connection error", error);
}

export default pool;
