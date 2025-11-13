import ApiError from "../utils/error.utils.js";
// import { getIO } from "../index.js";
import pool from "../config/db.config.js";
import slugify from "slugify";
import sendResponse from "../utils/sendResponse.util.js";
const allowedCategories = ["tech", "lifestyle", "health", "travel", "food"];

export const createPosts = async (req, res) => {
  try {
    const { title, content, category, image } = req.body;
    if (!title || !content || !category)
      return new ApiError(res, {
        statuscode: 400,
        message: "input fields cannot be empty",
      });
    const baseSlug = slugify(title, { lower: true, strict: true });
    if (!allowedCategories.includes(category.toLowerCase()))
      return new ApiError(res, {
        statuscode: 400,
        message: "invalid category",
      });
    const slug = `${baseSlug}-${req.user.id}-${Date.now()}`;
    const query = `
      INSERT INTO posts (user_id, title, content, category, slug)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [req.user.id, title, content, category, slug];
    const result = await pool.query(query, values);
    const newPost = result.rows[0];
    console.log(newPost);
    req.io.to(`category-${category}`).emit("post:new", newPost);
    return sendResponse(res, {
      message: "post created successfully",
      data: { newPost },
    });
  } catch (err) {
    return new ApiError(
      res,
      {
        statuscode: 500,
        message: err.message,
        errors: err,
      },
      err
    );
  }
};