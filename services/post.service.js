import pool from "../config/db.config.js";
import slugify from "slugify";
import { client } from "../config/redis.config.js";
import { sendNotification } from "./notifications.service.js";

const allowedCategories = ["tech", "lifestyle", "health", "travel", "food"];

export const createPost = async (userId, postData, req) => {
  const { title, content, category, image_url } = postData;
  if (!title || !content || !category) {
    throw new Error("input fields cannot be empty");
  }
  const baseSlug = slugify(title, { lower: true, strict: true });
  if (!allowedCategories.includes(category.toLowerCase())) {
    throw new Error("invalid category");
  }
  const slug = `${baseSlug}-${userId}-${Date.now()}`;
  let result;
  if (image_url) {
    const query = `
      INSERT INTO posts (user_id, title, content, category, slug, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [userId, title, content, category, slug, image_url];
    result = await pool.query(query, values);
  } else {
    const query = `
      INSERT INTO posts (user_id, title, content, category, slug)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [userId, title, content, category, slug];
    result = await pool.query(query, values);
  }

  const newPost = result.rows[0];

  // Handling socket emission within service if req is passed, or return data to controller to emit.
  // The original controller uses `req.io`.
  // I will pass `req` to service for now to keep it simple, or I should separate concerns strictly?
  // Ideally service returns data, controller emits.
  // But `notifications.service.js` takes `req`.
  // So I will act consistently and pass `req` if needed or return data.
  // `sendNotification` takes `req` to emit.

  if (req && req.io) {
    req.io.to(`category-${category}`).emit("post:new", newPost);
  }

  await sendNotification(req, {
    actorId: newPost.user_id,
    action: "new",
    entityId: newPost.id,
    entityType: "post",
    postCategory: category,
  });

  return newPost;
};

export const getPaginatedPosts = async (page, limit) => {
  const offset = (page - 1) * limit;
  const cacheKey = `post:page:${page}:limit:${limit}`;
  const cachedPostsExists = await client.get(cacheKey);

  if (cachedPostsExists) {
    return JSON.parse(cachedPostsExists);
  }

  const query = `
    SELECT id, title, content,slug, user_id, created_at
    FROM posts
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  const posts = rows;

  const countQuery = `SELECT COUNT(*) FROM posts`;
  const countRes = await pool.query(countQuery);
  const postCount = parseInt(countRes.rows[0].count);

  const response = {
    data: posts,
    meta: {
      page,
      limit,
      offset,
      totalPageCount: Math.ceil(postCount / limit),
    },
  };

  await client.setEx(cacheKey, 60, JSON.stringify(response));
  return response;
};

export const getPostBySlug = async (slug) => {
  if (!slug) throw new Error("invalid slug");
  const query = `
    SELECT id, title, slug, content, user_id, created_at
    FROM posts
    WHERE slug ILIKE $1
    LIMIT 1
  `;
  const result = await pool.query(query, [slug]);
  if (result.rowCount <= 0) throw new Error("post not found");
  return result.rows[0];
};

export const deletePost = async (postId, userId, req) => {
  if (!/^\d+$/.test(postId)) throw new Error("post id must be a number");

  const dbClient = await pool.connect();
  try {
    await dbClient.query("BEGIN");
    const query = `SELECT * FROM posts WHERE id = $1`;
    const result = await pool.query(query, [postId]);

    if (result.rowCount == 0) {
      throw new Error("invalid post id");
    }

    if (result.rows[0].user_id !== userId) {
      throw new Error("unauthorized"); // Original said "invalid", but check was user_id match.
    }

    const POST = result.rows[0];
    await pool.query(`DELETE FROM posts WHERE id = $1`, [POST.id]);

    await dbClient.query("COMMIT");

    if (req && req.io) {
      req.io.to(`post:${postId}`).emit("post:deleted", POST);
    }

    return true;
  } catch (err) {
    await dbClient.query("ROLLBACK");
    throw err;
  } finally {
    dbClient.release();
  }
};

export const updatePost = async (postId, userId, updateData, req) => {
  const { title, content } = updateData;
  if (!/^\d+$/.test(postId)) throw new Error("post id must be a number");
  if (!title || !content) throw new Error("invaid input");

  const postQuery = await pool.query(`SELECT * FROM posts WHERE id = $1`, [
    postId,
  ]);
  if (postQuery.rowCount <= 0) throw new Error("invalid post id");

  const post = postQuery.rows[0];
  if (post.user_id !== userId) throw new Error("unauthorized");

  const updatePostQuery = await pool.query(
    `UPDATE posts
       SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
    [title, content, post.id],
  );
  const updatedPost = updatePostQuery.rows[0];

  if (req && req.io) {
    req.io.to(`post:${postId}`).emit("post:updated", updatedPost);
  }

  return updatedPost;
};

export const searchPosts = async (rawQuery, limit, offset) => {
  if (!rawQuery || typeof rawQuery !== "string" || rawQuery.trim() === "") {
    return { total: 0, results: [] };
  }
  const q = rawQuery.trim();
  const queryText = q.length > 200 ? q.slice(0, 200) : q;
  const parsedLimit = Number.isInteger(Number(limit))
    ? Math.max(1, Number(limit))
    : 10;
  const parsedOffset = Number.isInteger(Number(offset))
    ? Math.max(0, Number(offset))
    : 0;

  if (queryText.length < 2) {
    const like = `%${queryText}%`;
    const totalRes = await pool.query(
      `SELECT COUNT(*) FROM posts WHERE title ILIKE $1 OR content ILIKE $1`,
      [like],
    );
    const rowsRes = await pool.query(
      `SELECT id, title, content, slug, user_id, created_at
       FROM posts
       WHERE title ILIKE $1 OR content ILIKE $1
       ORDER BY created_at DESC
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

export const reactToPost = async (postId, userId, req) => {
  if (!/^\d+$/.test(postId)) throw new Error("post id must be a number");

  const postQuery = await pool.query(`SELECT * FROM posts WHERE id=$1`, [
    postId,
  ]);
  if (postQuery.rowCount === 0) throw new Error("invalid post id");

  const post = postQuery.rows[0];
  const reactions = await pool.query(
    `SELECT * FROM post_reactions WHERE post_id = $1 AND user_id = $2`,
    [postId, userId],
  );

  if (reactions.rowCount === 0) {
    const result = await pool.query(
      `INSERT INTO post_reactions (user_id, post_id, reaction_type, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
      [userId, postId, "like"],
    );
    const totalLikes = await pool.query(
      `SELECT COUNT(*) AS likes FROM post_reactions WHERE post_id = $1 AND reaction_type = 'like'`,
      [postId],
    );
    const updated = result.rows[0];

    if (req && req.io) {
      req.io.to(`post:${postId}`).emit("post:reactionLike", {
        postId,
        total_likes: Number(totalLikes.rows[0].likes),
      });
    }

    if (userId != post.user_id) {
      await sendNotification(req, {
        userId: post.user_id,
        actorId: userId,
        action: "like",
        entityType: "post",
        entityId: postId,
      });
    }

    return {
      postId,
      reaction: updated,
      total_likes: Number(totalLikes.rows[0].likes),
    };
  } else {
    await pool.query(
      `DELETE FROM post_reactions WHERE post_id=$1 AND user_id=$2`,
      [postId, userId],
    );
    const totalLikes = await pool.query(
      `SELECT COUNT(*) AS likes FROM post_reactions WHERE post_id = $1 AND reaction_type = 'like'`,
      [postId],
    );

    if (req && req.io) {
      req.io.to(`post:${postId}`).emit("post:reactionDislike", {
        postId,
        total_likes: Number(totalLikes.rows[0].likes),
      });
    }

    return {
      postId,
      total_likes: Number(totalLikes.rows[0].likes),
    };
  }
};
