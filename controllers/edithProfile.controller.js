import ApiError from "../utils/error.utils.js";
import pool from "../config/db.config.js";
import sendResponse from "../utils/sendResponse.util.js";

export default async (req, res) => {
  try {
    const allowed = ["username", "bio", "age", "profileImageUrl"];
    const payload = {
      username: req.body.username ?? undefined,
      bio: req.body.bio ?? undefined,
      age: req.body.age ?? undefined,
      profileImageUrl: req.body.profileImageUrl ?? undefined,
    };

    if (payload.username?.length === 0)
      return new ApiError(res, {
        message: "invalid username",
        statuscode: 400,
      });
    if (payload.bio?.length === 0)
      return new ApiError(res, {
        message: "invalid bio",
        statuscode: 400,
      });
    if (payload.profileImageUrl?.length === 0)
      return new ApiError(res, {
        message: "invalid image url",
        statuscode: 400,
      });
    if ((payload.age && payload.age < 18) || isNaN(payload.age))
      return new ApiError(res, {
        message: "invaild age",
        statuscode: 400,
      });
    const updates = [];
    const values = [];
    let idx = 1;
    if (payload.username !== undefined) {
      if (
        typeof payload.username !== "string" ||
        payload.username.trim().length < 3
      ) {
        return new ApiError(res, {
          message: "username must be at least 3 characters",
          statuscode: 400,
        });
      }
      if (payload.username === req.user.username)
        return new ApiError(res, {
          message: "username cannot be thesame as your previous username",
          statuscode: 400,
        });
      const userExists = await pool.query(
        "SELECT user_name FROM users WHERE user_name=$1",
        [payload.username]
      );
      if (userExists.rowCount !== 0)
        return new ApiError(res, {
          message: "invalid username",
          statuscode: 400,
        });
      updates.push(`user_name = $${idx++}`);
      values.push(payload.username.trim());
    }

    if (payload.bio !== undefined) {
      if (typeof payload.bio !== "string") {
        return new ApiError(res, {
          message: "bio must be a string",
          statuscode: 400,
        });
      }
      updates.push(`bio = $${idx++}`);
      values.push(payload.bio.trim());
    }

    if (payload.age !== undefined) {
      const ageNum = Number(payload.age);
      if (!Number.isInteger(ageNum) || ageNum < 0 || ageNum > 150) {
        return new ApiError(res, { message: "invalid age", statuscode: 400 });
      }
      updates.push(`age = $${idx++}`);
      values.push(ageNum);
    }

    if (payload.profileImageUrl !== undefined) {
      if (
        typeof payload.profileImageUrl !== "string" ||
        !payload.profileImageUrl.startsWith("http")
      ) {
        return new ApiError(res, {
          message: "invalid profileImageUrl",
          statuscode: 400,
        });
      }
      updates.push(`image_url = $${idx++}`);
      values.push(payload.profileImageUrl);
    }
    if (updates.length === 0) {
      return new ApiError(res, {
        message: "no valid fields provided for update",
        statuscode: 400,
      });
    }
    const userId = req.user?.id;
    if (!userId)
      return new ApiError(res, { message: "unauthorized", statuscode: 401 });
    const query = `
      UPDATE users
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, user_name AS username, bio, age, image_url AS profileImageUrl, updated_at
    `;
    values.push(userId);
    const result = await pool.query(query, values);
    if (result.rowCount === 0)
      return new ApiError(res, { message: "user not found", statuscode: 404 });
    return sendResponse(res, {
      data: result.rows[0],
      message: "profile updated",
      statusCodes: 200,
    });
  } catch (err) {
    console.error(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
