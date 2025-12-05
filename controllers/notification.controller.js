import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import pool from "../config/db.config.js";

export const getNotification = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const userId = req.user.id;
    const cacheKey = `notification:page:${page}:offset:${offset}`;
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
        [userId, limit, offset]
      ),

      pool.query(
        `
      SELECT COUNT(*) AS total
      FROM notifications
      WHERE user_id = $1
    `,
        [userId]
      ),
    ]);

    const total = count.rows[0].total;
    const totalPages = Math.ceil(total / limit);
    const result = {
      data: {
        notifications: data.rows,
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
    return sendResponse(res, { ...result });
  } catch (err) {
    console.log(err);
    new ApiError(res, { message: err.message, errors: err }, err);
  }
};
export const markAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.user.id;
    console.log(userId);
    if (isNaN(notificationId))
      return new ApiError(res, {
        message: "invalid notifcation id",
        statuscode: 400,
      });
    if (!notificationId) {
      const notificaiton = await pool.query(
        `UPDATE notifications SET is_read=true WHERE is_read=false AND user_id=$1`,
        [userId]
      );
      if (notificaiton.rowCount === 0)
        return new ApiError(res, {
          message: "failed to update notifications, check notification id",
          statuscode: 400,
        });
      const updatedNotification = notificaiton.rows[0];
      return sendResponse(res, {
        message: "notificaitons updated successfully",
        data: updatedNotification,
      });
    }
    const notificaiton = await pool.query(
      `UPDATE notifications SET is_read=true WHERE is_read=false AND user_id=$1 AND id=$2`,
      [userId, notificationId]
    );
    if (notificaiton.rowCount === 0)
      return new ApiError(res, {
        message: "failed to update notifications, check notification id",
        statuscode: 400,
      });
    const updatedNotification = notificaiton.rows[0];
    console.log({ updatedNotification });
    return sendResponse(res, {
      message: "notificaitons updated successfully",
      data: updatedNotification,
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const clearAll = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId)
    const deleteNotifications = await pool.query(
      `DELETE FROM notifications WHERE user_id=$1`,
      [userId]
    );
    return sendResponse(res, { message: "notifications cleared successfully" });
  } catch (err) {
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
