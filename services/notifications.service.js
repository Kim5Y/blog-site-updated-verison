import pool from "../config/db.config.js";
import { client } from "../config/redis.config.js";
export const sendNotification = async (
  req,
  { userId, actorId, action, entityType, entityId, postCategory },
) => {
  try {
    const query = await pool.query(
      `SELECT id, user_name  FROM users WHERE id=$1`,
      [actorId],
    );
    const actorAccount = query.rows[0];
    const createNotificationMessage = (action, entityType) => {
      if (action === "new" && entityType === "post") {
        const message = `${actorAccount.user_name} recently shared a post`;
        return message;
      }
      if (action === "comment" && entityType === "post") {
        const message = `${actorAccount.user_name} recently commented on your post`;
        return message;
      }
      if (action === "like" && entityType === "post") {
        const message = `${actorAccount.user_name} liked your post`;
        return message;
      }
      if (action === "like" && entityType === "comment") {
        const message = `${actorAccount.user_name} reacted on your comment`;
        return message;
      }
      if (action === "reply" && entityType === "comment") {
        const message = `${actorAccount.user_name} replyed on your comment`;
        return message;
      }
      if (action === "new" && entityType === "comment") {
        const message = `${actorAccount.user_name} commented on your post`;
        return message;
      }
    };
    const message = createNotificationMessage(action, entityType);

    if (action === "new" && entityType === "post") {
      const getUsersCategoryQuery = await pool.query(
        `SELECT id FROM users WHERE $1 = ANY(categories)`,
        [postCategory],
      );
      const subscribedUsers = getUsersCategoryQuery.rows;
      const ids = subscribedUsers.map(({ id }) => id);
      let notificationdbs = null;
      ids.forEach(async (id) => {
        const result = await pool.query(
          `
      INSERT INTO notifications (
        user_id, actor_id, action, entity_type, entity_id, message
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
      `,
          [id, actorId, action, entityType, entityId, message],
        );
        const notification = result.rows[0];
        notificationdbs = notification;
        req.io.to(`user:${id}`).emit("notification", notification);
      });
      return;
    }
    const result = await pool.query(
      `
    INSERT INTO notifications (
      user_id, actor_id, action, entity_type, entity_id, message
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
    `,
      [userId, actorId, action, entityType, entityId, message],
    );
    const notification = result.rows[0];
    req.io.to(`user:${userId}`).emit("notification", notification);
    return notification;
  } catch (error) {
    return error;
  }
};

export const getNotifications = async (userId, page, limit) => {
  const offset = (page - 1) * limit;

  // Original controller used cache. Should service use cache? Yes.
  // But original controller `notification.controller.js` logic for cache key was:
  // `notification:page:${page}:offset:${offset}` -> Wait, offset is derived from page/limit.
  // Original: `const cacheKey = \`notification:page:${page}:offset:${offset}\`;`
  // I prefer consistent cache keys.

  // Also, importing client from redis config?
  // I need to add import if not present.
  // The previous view of file showed only `import pool`.
  // So I need to add `import { client } ...` at top.

  // For now, let's write the functions and I'll add import in another chunk.

  // I need `client` for caching.

  /*
    const cacheKey = `notification:user:${userId}:page:${page}:limit:${limit}`;
    const cachedData = await client.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);
    */

  // Wait, I can't access `client` unless I import it.
  // So I will start with adding import.

  const [data, count] = await Promise.all([
    pool.query(
      `
      SELECT id, message, is_read, created_at
      FROM notifications
      WHERE user_id = $1
      ORDER BY is_read ASC, created_at DESC
      LIMIT $2
      OFFSET $3
    `,
      [userId, limit, offset],
    ),

    pool.query(
      `
      SELECT COUNT(*) AS total
      FROM notifications
      WHERE user_id = $1
    `,
      [userId],
    ),
  ]);

  const total = count.rows[0].total;
  const totalPages = Math.ceil(total / limit);
  const result = {
    data: {
      notifications: data.rows, // Original: data.rows
    },
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };

  // await client.setEx(cacheKey, 60, JSON.stringify(result));
  return result;
};

export const markAsRead = async (userId, notificationId) => {
  if (!notificationId) {
    // Mark all as read
    const notification = await pool.query(
      `UPDATE notifications SET is_read=true WHERE is_read=false AND user_id=$1 RETURNING *`,
      [userId],
    );
    if (notification.rowCount === 0) return null; // Or throw error? Original threw 400 "failed to update..."
    return notification.rows[0];
    // Original returned rows[0]. If multiple updated, returns first?
    // Yes. "updatedNotification = notificaiton.rows[0]"
  }

  const notification = await pool.query(
    `UPDATE notifications SET is_read=true WHERE is_read=false AND user_id=$1 AND id=$2 RETURNING *`,
    [userId, notificationId],
  );

  if (notification.rowCount === 0)
    throw new Error("failed to update notifications, check notification id");

  return notification.rows[0];
};

export const clearAllNotifications = async (userId) => {
  await pool.query(`DELETE FROM notifications WHERE user_id=$1`, [userId]);
  return true;
};
