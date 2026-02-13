import pool from "../config/db.config.js";
import { sendNotification } from "./notifications.service.js";
import { client } from "../config/redis.config.js";

export const addComment = async (commentData, req) => {
  const { postId, content, userId, parentId } = commentData;

  // Validation
  if (!/^\d+$/.test(postId)) throw new Error("post id must be a number");
  if (!content) throw new Error("input can not be empty");

  // Check if post exists
  const postQuery = await pool.query(`SELECT * FROM posts WHERE id = $1`, [
    postId,
  ]);
  if (postQuery.rowCount === 0) throw new Error("invalid post id");
  const post = postQuery.rows[0];

  // Parent comment logic
  if (parentId) {
    if (!/^\d+$/.test(parentId)) throw new Error("parent id must be a number");
    const parentCommentQuery = await pool.query(
      `SELECT * FROM comments WHERE id = $1`,
      [parentId],
    );
    if (parentCommentQuery.rowCount === 0)
      throw new Error("parent comment not found");

    const parentComment = parentCommentQuery.rows[0];

    const query = `
        INSERT INTO comments (post_id, user_id, content, parent_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
    const values = [postId, userId, content, parentId];
    const result = await pool.query(query, values);
    const newReply = result.rows[0];

    // Notifications for reply
    if (userId != parentComment.user_id) {
      await sendNotification(req, {
        userId: parentComment.user_id,
        actorId: userId,
        action: "reply",
        entityType: "comment",
        entityId: newReply.id,
      });
    }

    // Also notify post owner if it's not the same person?
    // Original controller logic:
    /*
        if (parentId) { ... sendNotification(reply...); return ... }
        */
    // Original logic returns after reply. So it only notifies parent comment owner, NOT post owner?
    // Let's verify original logic.
    /*
        if (parentId) {
          ... insert ...
          if (useId != parentcomment.user_id) { sendNotification(...) }
          return sendResponse(...)
        }
        */
    // Yes, it returns.

    return { type: "reply", data: newReply };
  }

  // Direct comment on post
  const query = `
    INSERT INTO comments (post_id, user_id, content)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [postId, userId, content];
  const result = await pool.query(query, values);
  const newComment = result.rows[0];

  // Notification for post owner
  if (userId != post.user_id) {
    await sendNotification(req, {
      userId: post.user_id,
      actorId: userId,
      action: "comment",
      entityType: "post",
      entityId: newComment.id,
    });
  }

  return { type: "comment", data: newComment };
};

export const deleteComment = async (commentId, userId, req) => {
  const parsedCommentId = parseInt(commentId);
  if (!/^\d+$/.test(parsedCommentId))
    throw new Error("comment id must be a number");

  const dbClient = await pool.connect();
  try {
    await dbClient.query("BEGIN");
    const query = `SELECT * FROM comments WHERE id = $1`;
    const result = await pool.query(query, [parsedCommentId]);

    if (result.rowCount == 0) {
      throw new Error("invalid comment id");
    }

    const comment = result.rows[0];

    if (comment.user_id !== userId) {
      // Check if user is POST owner? Original logic:
      /*
            if (result.rows[0].user_id !== req.user.id) {
                // check if it is the owner of the post
                const post = await pool.query(`SELECT * FROM posts WHERE id = $1`, [comment.post_id]);
                if (post.rows[0].user_id !== req.user.id) {
                    return new ApiError(res, { message: "invalid", statuscode: 403 });
                }
            }
            */
      // So logic: Comment Owner OR Post Owner can delete.

      const postQuery = await pool.query(`SELECT * FROM posts WHERE id = $1`, [
        comment.post_id,
      ]);
      // If post doesn't exist? (Should exist due to foreign key, but safety)
      if (postQuery.rowCount > 0) {
        if (postQuery.rows[0].user_id !== userId) {
          throw new Error("unauthorized");
        }
      } else {
        // If post deleted, comment might be gone strictly, but if we are here...
        throw new Error("unauthorized");
      }
    }

    await pool.query(`DELETE FROM comments WHERE id = $1`, [comment.id]);
    await dbClient.query("COMMIT");

    return true;
  } catch (err) {
    await dbClient.query("ROLLBACK");
    throw err;
  } finally {
    dbClient.release();
  }
};

export const getPostComments = async (postId, page, limit) => {
  if (isNaN(postId)) throw new Error("Invalid post id");

  const offset = (page - 1) * limit;
  const cacheKey = `comments:page:${page}:limit:${limit}`;
  const cacheCommentData = await client.get(cacheKey);

  if (cacheCommentData) {
    return JSON.parse(cacheCommentData);
  }

  const { rows: allComments } = await pool.query(
    `SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
    [postId],
  );

  if (allComments.length === 0) {
    // Service returns null or empty array? Controller returned 404.
    // I will return empty data structure or throw specific error?
    // Returning null/empty seems better than throwing error for "no comments".
    // But original controller returns 404 "No comments found".
    return null;
  }

  const topLevelComments = allComments.filter((c) => c.parent_id === null);
  const paginatedTopLevel = topLevelComments.slice(offset, offset + limit);
  const commentMap = {};
  allComments.forEach((c) => (commentMap[c.id] = { ...c, replies: [] }));
  allComments.forEach((c) => {
    if (c.parent_id !== null) {
      const parent = commentMap[c.parent_id];
      if (parent) parent.replies.push(commentMap[c.id]);
    }
  });
  const result = paginatedTopLevel.map((c) => commentMap[c.id]);

  const response = {
    success: true,
    data: result,
    meta: {
      totalComments: topLevelComments.length,
      page,
      limit,
    },
  };
  await client.setEx(cacheKey, 60, JSON.stringify(response));
  return response;
};

export const reactToComment = async (commentId, postId, userId, req) => {
  if (isNaN(commentId)) throw new Error("invalid comment id");

  const { rows: comments } = await pool.query(
    `SELECT * FROM comments WHERE id=$1`,
    [commentId],
  );
  if (comments.length == 0)
    throw new Error("comment not found check the comment id");

  const postQuery = await pool.query("SELECT id FROM posts WHERE id=$1", [
    postId,
  ]);
  if (postQuery.rowCount === 0) throw new Error("invalid post id");

  const post = postQuery.rows[0];

  const { rows: userReaction } = await pool.query(
    `SELECT * FROM comment_reactions WHERE comment_id = $1 AND user_id = $2`,
    [commentId, userId],
  );

  if (userReaction.length == 0) {
    const result = await pool.query(
      `INSERT INTO comment_reactions (user_id, comment_id, reaction_type, created_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING *`,
      [userId, commentId, "like"],
    );
    const totalLikes = await pool.query(
      `SELECT COUNT(*) AS likes FROM comment_reactions WHERE comment_id = $1 AND reaction_type = 'like'`,
      [commentId],
    );

    if (req.user.id != comments[0].user_id) {
      await sendNotification(req, {
        userId: comments[0].user_id,
        actorId: userId,
        action: "like",
        entityType: "comment",
        entityId: commentId,
      });
    }

    const updated = result.rows[0];

    if (req && req.io) {
      req.io.to(`comment:${post.id}`).emit("comment:reactionLike", {
        commentId,
        reaction: updated,
        total_likes: Number(totalLikes.rows[0].likes),
      });
    }

    return {
      commentId,
      reaction: updated,
      total_likes: Number(totalLikes.rows[0].likes),
      type: "like",
    };
  } else {
    await pool.query(
      `DELETE FROM comment_reactions WHERE comment_id=$1 AND user_id=$2`,
      [commentId, userId],
    );
    const totalLikes = await pool.query(
      `SELECT COUNT(*) AS likes FROM comment_reactions WHERE comment_id = $1 AND reaction_type = 'like'`,
      [commentId],
    );

    if (req && req.io) {
      req.io.to(`comment:${post.id}`).emit("comment:reactionDislike", {
        commentId,
        total_likes: Number(totalLikes.rows[0].likes),
      });
    }

    return {
      commentId,
      total_likes: Number(totalLikes.rows[0].likes),
      type: "dislike",
    };
  }
};

export const updateComment = async (
  commentId,
  postId,
  userId,
  content,
  req,
) => {
  if (isNaN(commentId)) throw new Error("invalid comment id");
  if (!content) throw new Error("invalid content");

  const { rows: userComment } = await pool.query(
    `SELECT * FROM comments WHERE id=$1 AND post_id=$2`,
    [commentId, postId],
  );

  if (userComment.length === 0) throw new Error("invalid comment id");
  if (userComment[0].user_id !== userId) throw new Error("unauthorized");

  const { rows: updatedComment } = await pool.query(
    `UPDATE comments
         SET  content = $1, updated_at = NOW()
         WHERE id = $3 AND post_id=$2
         RETURNING *`,
    [content, postId, userComment[0].id],
  );

  if (userComment[0].parent_id !== null) {
    if (req && req.io) {
      req.io
        .to(`comment:${postId}-${userComment[0].parent_id}`)
        .emit("reply:updated", updatedComment[0]);
    }
  } else {
    if (req && req.io) {
      req.io.to(`post:${postId}`).emit("comment:updated", updatedComment[0]);
    }
  }

  return updatedComment[0];
};
