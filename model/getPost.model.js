import pool from "../config/db.config.js";
export const getPaginatedPosts = async (limit, offset) => {
  const query = `
    SELECT id, title, content,slug, user_id, created_at
    FROM posts
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
};
export const getPostCount = async () => {
  const query = `SELECT COUNT(*) FROM posts`;
  const { rows } = await pool.query(query);
  return parseInt(rows[0].count);
};
