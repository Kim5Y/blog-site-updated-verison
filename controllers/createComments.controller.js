import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
import sendResponse from "../utils/sendResponse.util.js";
export default async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user.id;
    const { content, parentId } = req.body;
    if (!postId) return new ApiError(res, { message: "invalid post Id" });
    if (isNaN(postId)) return new ApiError(res, { message: "invalid post id" });
    if (!content)
      return new ApiError(res, { message: "comment content cannot be empty" });

    const postQuery = await pool.query(`SELECT FROM posts WHERE id=$1`, [
      postId,
    ]);
    if (postQuery.rowCount === 0)
      return new ApiError(res, {
        message: "post with the id porvided is not found",
      });
      // console.log(parentId)
    if (parentId) {
      const findParentComment = await pool.query(
        `SELECT * FROM comments WHERE id = $1`,
        [parentId]
      );
      if (findParentComment.rowCount === 0)
        return new ApiError(res, { message: "parent comment not found" });

      await pool.query(
        `
      INSERT INTO comments (post_id, content, parent_id, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `,
        [postId, content, parentId, userId]
      );
      const countComments = await pool.query(
        `SELECT COUNT(*) FROM comments WHERE parent_id IS NULL`
      );
      // req.io.to(`category-${postQuery.rows[0].category}`).emit()
      return sendResponse(res, {
        statusCodes: 201,
        data: {
          parentId,
          content,
          postId,
          totalComments: countComments.rows[0].count,
        },
      });
    }
    // console.log({ postId, content, parentId, userId });
    await pool.query(
      `
      INSERT INTO comments (post_id, content, user_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `,
      [postId, content, userId]
    );
    const countComments = await pool.query(
      `SELECT COUNT(*) FROM comments WHERE parent_id IS NULL`
    );
    return sendResponse(res, {
      statusCodes: 201,
      data: {
        parentId,
        content,
        postId,
        totalComments: countComments.rows[0].count,
      },
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
