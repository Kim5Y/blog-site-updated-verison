import ApiError from "../utils/error.utils.js";
import { getIO } from "../index.js";
import pool from "../config/db.config.js";
import slugify from "slugify";
import sendResponse from "../utils/sendResponse.util.js";

export const createPosts = async(req, res) => {
  try {
    const io = getIO();
    const {title, content, category, image} = req.body;
   const baseSlug = slugify(title, {lower: true, strict:true});
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
   return res.sendStatus(200);
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

//get the clients category by the refresh token 
//and send post to each user connected to that category
//already started check ur left