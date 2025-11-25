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

export const searchUsers = async (rawQuery, limit, offset) => {
  if (!rawQuery || typeof rawQuery !== "string" || rawQuery.trim() === "") {
    return { total: 0, results: [] };
  }

  const q = rawQuery.trim();
  const queryText = q.length > 200 ? q.slice(0, 200) : q;
  const parsedLimit = Number.isInteger(Number(limit))
    ? Math.max(1, Math.min(50, Number(limit)))
    : 10;
  const parsedOffset = Number.isInteger(Number(offset))
    ? Math.max(0, Number(offset))
    : 0;
  if (queryText.length < 2) {
    const like = `%${queryText}%`;
    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM users WHERE user_name ILIKE $1`,
      [like]
    );
    const rowsRes = await pool.query(
      `SELECT id, user_name
       FROM users
       WHERE user_name ILIKE $1
       ORDER BY user_name
       LIMIT $2 OFFSET $3`,
      [like, parsedLimit, parsedOffset]
    );
    return {
      total: Number(totalRes.rows[0].count) || 0,
      results: rowsRes.rows || [],
    };
  }

  const sql = `
  WITH q AS (
    SELECT
      websearch_to_tsquery('english', unaccent($1::text))         AS webq,
      plainto_tsquery('english', unaccent($1::text))             AS plainq
  ),
  qsel AS (
    SELECT COALESCE(webq, plainq) AS query, webq::text AS webq_text, plainq::text AS plainq_text
    FROM q
  ),
  ranked AS (
    SELECT
      u.id,
      u.user_name,
      ts_rank_cd(u.search_vector, qsel.query) AS rank,
      ts_headline('english', u.user_name, qsel.query,
        'StartSel= StopSel= MaxFragments=2, MaxWords=35') AS snippet
    FROM users u
    CROSS JOIN qsel
    WHERE u.search_vector @@ qsel.query
    ORDER BY rank DESC, u.user_name ASC
    LIMIT $2 OFFSET $3
  ),
  cnt AS (
    SELECT count(*) AS total FROM users u CROSS JOIN qsel WHERE u.search_vector @@ qsel.query
  ),
  agg AS (
    SELECT COALESCE(json_agg(ranked), '[]'::json) AS results FROM ranked
  )
  SELECT (SELECT total FROM cnt) AS total, agg.results,
         (SELECT webq_text FROM qsel) AS webquery, (SELECT plainq_text FROM qsel) AS plainquery
  FROM agg;
  `;

  const res = await pool.query(sql, [queryText, parsedLimit, parsedOffset]);
  if (!res.rows || res.rows.length === 0) {
    return { total: 0, results: [] };
  }
  const row = res.rows[0];
  return {
    total: Number(row.total) || 0,
    results: row.results || []
  };
};
export const searchPost = async (rawQuery, limit, offset) => {
  if (!rawQuery || typeof rawQuery !== "string" || rawQuery.trim() === "") {
    return { total: 0, results: [] };
  }
  const q = rawQuery.trim();
  const queryText = q.length > 200 ? q.slice(0, 200) : q;
  const parsedLimit = Number.isInteger(Number(limit)) ? Math.max(1, Number(limit)) : 10;
  const parsedOffset = Number.isInteger(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  if (queryText.length < 2) {
    const like = `%${queryText}%`;
    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM posts WHERE title ILIKE $1 OR content ILIKE $1`,
      [like]
    );
    const rowsRes = await pool.query(
      `SELECT id, title, content, slug, user_id, created_at
       FROM posts
       WHERE title ILIKE $1 OR content ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [like, parsedLimit, parsedOffset]
    );
    return {
      total: Number(totalRes.rows[0].count) || 0,
      results: rowsRes.rows || [],
    };
  }

  const sql = `
  WITH q AS (
    SELECT websearch_to_tsquery('english', unaccent($1::text)) AS query
  ),
  matched AS (
    SELECT
      p.id,
      p.title,
      p.user_id,
      p.created_at,
      substring(p.content FROM 1 FOR 300) AS content
    FROM posts p, q
    WHERE p.search_vector @@ q.query
    ORDER BY p.created_at DESC
    LIMIT $2 OFFSET $3
  ),
  cnt AS (
    SELECT count(*) AS total FROM posts p, q WHERE p.search_vector @@ q.query
  ),
  agg AS (
    SELECT COALESCE(json_agg(matched), '[]'::json) AS results FROM matched
  )
  SELECT (SELECT total FROM cnt) AS total, agg.results
  FROM agg;
  `;

  const res = await pool.query(sql, [queryText, parsedLimit, parsedOffset]);
  if (!res.rows || res.rows.length === 0) {
    return { total: 0, results: [] };
  }
  const row = res.rows[0];
  return {
    total: Number(row.total) || 0,
    results: row.results || [],
  };
};