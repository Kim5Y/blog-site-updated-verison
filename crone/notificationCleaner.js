import cron from "node-cron";
import pool from "../config/db.config.js";
cron.schedule("0 1 * * *", async () => {
  try {
    await pool.query(`
      DELETE FROM notifications
      WHERE is_read = true
      AND created_at < NOW() - INTERVAL '5 days'
    `);
    console.log("Old read notifications deleted.");
  } catch (error) {
    console.error("Cron job error:", error);
  }
});