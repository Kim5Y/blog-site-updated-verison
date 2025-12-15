import pool from "../config/db.config.js";
export const sendNotification = async (
  req,
  { userId, actorId, action, entityType, entityId, postCategory }
) => {
  try {
    const query = await pool.query(
      `SELECT id, user_name  FROM users WHERE id=$1`,
      [actorId]
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
        [postCategory]
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
          [id, actorId, action, entityType, entityId, message]
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
      [userId, actorId, action, entityType, entityId, message]
    );
    const notification = result.rows[0];
    req.io.to(`user:${userId}`).emit("notification", notification);
    return notification;
  } catch (error) {
    return error;
  }
};

