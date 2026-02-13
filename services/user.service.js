import pool from "../config/db.config.js";
import { client } from "../config/redis.config.js";
import ApiError from "../utils/error.utils.js"; // Needed? Service usually throws Error, controller handles ApiError.

export const getUserProfile = async (userId, page, limit) => {
  if (!userId) throw new Error("invalid user id");
  if (isNaN(userId)) throw new Error("invalid userId");

  const offset = (page - 1) * limit;
  const cacheKey = `userProfileInfo:page:${page}:limit:${limit}`;
  const cachedDataExists = await client.get(cacheKey);

  if (cachedDataExists) {
    return JSON.parse(cachedDataExists);
  }

  const userInfoQuery = await pool.query(
    `SELECT id, user_name, email, categories  FROM users WHERE id=$1`,
    [userId],
  );

  if (userInfoQuery.rowCount <= 0) throw new Error("user not found");
  const userInfo = userInfoQuery.rows[0];

  const userPostsQuery = await pool.query(
    `SELECT id, title, content,slug, user_id,created_at FROM posts WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset],
  );

  let userPosts = null;
  let postCount = null;

  if (userPostsQuery.rowCount !== 0) {
    const postCountQuery = await pool.query(
      `SELECT COUNT(*) FROM posts WHERE user_id =$1`,
      [userId],
    );
    userPosts = userPostsQuery.rows; // Controller used rows[0] but that seems wrong for list of posts? Controller: `userPosts = userPostsQuery.rows[0];` -> This assigns FIRST post to userPosts.
    // Wait, looking at controller `userProfile.controller.js`:
    // `userPosts = userPostsQuery.rows[0];`
    // If query returns multiple rows, `rows[0]` is just the first one.
    // `userPosts` variable name implies plural, but controller logic assigns single object?
    // Let's check the response structure in controller: `data: { userInfo, userPosts }`.
    // If it's a list, it should be `userPostsQuery.rows`.
    // `userPostsQuery` is `SELECT ... FROM posts ... LIMIT ...`. This returns multiple rows.
    // I suspect the original code had a bug where it only returned the first post or `rows` was accessed incorrectly.
    // I will fix it to return `rows`.

    userPosts = userPostsQuery.rows;
    postCount = postCountQuery.rows[0];
  } else {
    userPosts = [];
    postCount = { count: 0 };
  }

  const response = {
    data: { userInfo, userPosts },
    meta: { limit, page, offset, postCount: postCount?.count },
  };

  await client.setEx(cacheKey, 60, JSON.stringify(response));
  return response;
};

export const logout = async (userId, cookiesRefreshToken) => {
  // Controller logic: clears cookie (controller job), updates DB.

  await pool.query(
    `UPDATE users
         SET refresh_token = ARRAY[]::text[]
         WHERE id = $1`,
    [userId],
  );

  return true;
};

export const updateUserProfile = async (userId, payload) => {
  // Validation logic from controller
  const updates = [];
  const values = [];
  let idx = 1;

  if (payload.username !== undefined) {
    if (
      typeof payload.username !== "string" ||
      payload.username.trim().length < 3
    ) {
      throw new Error("username must be at least 3 characters");
    }
    // Check if username is same as current (needs current user fetch?)
    // Controller checked: `if (payload.username === req.user.username)`
    // I should probably pass current username or fetch it.
    // Fetching is safer.
    const currentUser = await pool.query(
      "SELECT user_name FROM users WHERE id=$1",
      [userId],
    );
    if (currentUser.rows[0].user_name === payload.username) {
      throw new Error("username cannot be thesame as your previous username");
    }

    const userExists = await pool.query(
      "SELECT user_name FROM users WHERE user_name=$1",
      [payload.username],
    );
    if (userExists.rowCount !== 0) throw new Error("invalid username"); // Taken

    updates.push(`user_name = $${idx++}`);
    values.push(payload.username.trim());
  }

  if (payload.bio !== undefined) {
    if (typeof payload.bio !== "string") {
      throw new Error("bio must be a string");
    }
    updates.push(`bio = $${idx++}`);
    values.push(payload.bio.trim());
  }

  if (payload.age !== undefined) {
    const ageNum = Number(payload.age);
    if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 150) {
      throw new Error("invalid age");
    }
    updates.push(`age = $${idx++}`);
    values.push(ageNum);
  }

  if (payload.profileImageUrl !== undefined) {
    if (
      typeof payload.profileImageUrl !== "string" ||
      !payload.profileImageUrl.startsWith("http")
    ) {
      throw new Error("invalid profileImageUrl");
    }
    updates.push(`image_url = $${idx++}`);
    values.push(payload.profileImageUrl);
  }

  if (updates.length === 0) {
    throw new Error("no valid fields provided for update");
  }

  const query = `
      UPDATE users
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, user_name AS username, bio, age, image_url AS profileImageUrl, updated_at
    `;
  values.push(userId);
  const result = await pool.query(query, values);

  if (result.rowCount === 0) throw new Error("user not found"); // Should not happen if userId is from token

  return result.rows[0];
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
      [like],
    );
    const rowsRes = await pool.query(
      `SELECT id, user_name
       FROM users
       WHERE user_name ILIKE $1
       ORDER BY user_name
       LIMIT $2 OFFSET $3`,
      [like, parsedLimit, parsedOffset],
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
    results: row.results || [],
  };
};
