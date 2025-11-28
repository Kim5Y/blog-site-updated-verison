import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
import slugify from "slugify";
import sendResponse from "../utils/sendResponse.util.js";
import { sendNotification } from "../services/notifications.service.js";
const allowedCategories = ["tech", "lifestyle", "health", "travel", "food"];

export const createPosts = async (req, res) => {
  try {
    const { title, content, category, image_url } = req.body;
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
    let result;
    if (image_url) {
      const query = `
      INSERT INTO posts (user_id, title, content, category, slug, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
      const values = [req.user.id, title, content, category, slug, image_url];
      result = await pool.query(query, values);
    } else {
      const query = `
      INSERT INTO posts (user_id, title, content, category, slug)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
      const values = [req.user.id, title, content, category, slug];
      result = await pool.query(query, values);
    }
    const newPost = result.rows[0];
    console.log(newPost);
    req.io.to(`category-${category}`).emit("post:new", newPost);
    await sendNotification(req, {
      actorId: newPost.user_id,
      action: "new",
      entityId: newPost.id,
      entityType: "post",
      postCategory: category,
    });
    return sendResponse(res, {
      statuscode: 201,
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
// import { fileTypeFromBuffer } from "file-type";
// import imageUrl from "../config/cloudinary.config.js";
// export const imageUpload = async (req, res) => {
//   try {
//     const realType = await fileTypeFromBuffer(req.file.buffer);
//     if (!["jpg", "png", "jpeg", "webp"].includes(realType.ext))
//       return new ApiError(res, {
//         message: "invalid file format only accepts an image",
//         statuscode: 400,
//       });
//     const image = req.file.buffer;
//     const cloudIMageUrl = await imageUrl(image);
//     const query = `
//       INSERT INTO posts (image_url)
//       VALUES ($1) WHERE user_id=$2
//       RETURNING *;
//     `;
//     const values = [cloudIMageUrl, req.user.id];
//     await pool.query(query, values);
//     return res.sendStatus(200);
//   } catch (err) {
//     console.log(err);
//     return new ApiError(res, { message: err.message, errors: err }, err);
//   }
// };
