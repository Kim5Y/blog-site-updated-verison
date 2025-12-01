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