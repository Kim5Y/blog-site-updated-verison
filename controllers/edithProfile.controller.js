import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as UserService from "../services/user.service.js";

export default async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return new ApiError(res, { message: "unauthorized", statuscode: 401 });

    const payload = {
      username: req.body.username ?? undefined,
      bio: req.body.bio ?? undefined,
      age: req.body.age ?? undefined,
      profileImageUrl: req.body.profileImageUrl ?? undefined,
    };

    // Controller validation for empty fields (length === 0)
    // Service handles basic type checks.
    // Controller checks for empty strings before calling service?
    // Original controller had scattered checks.
    // UserService handles validation logic inside updateUserProfile,
    // BUT `userService` implementation I wrote in Step 115 checks `if (payload.username !== undefined)...`
    // It doesn't check checks like `if (payload.username?.length === 0)` BEFORE `!== undefined` block.
    // However, `payload.username.trim().length < 3` check in service covers empty string (0 < 3).
    // So service validation is robust enough?
    // `payload.bio` -> `bio must be a string` in service.
    // Original controller check: `if (payload.bio?.length === 0)`.
    // Service check: `if (typeof payload.bio !== "string")`. Empty string IS a string.
    // So service allows empty bio?
    // I should probably add empty string checks in controller or update service.
    // I'll adhere to service interface which accepts payload.
    // If service throws error for validation, I catch it.

    // Just blindly calling service

    // Wait, original controller explicitly returns 400 for empty `username`, `bio`, `profileImageUrl` IF they are present but length 0?
    // No, `if (payload.username?.length === 0)`.
    // If `username` is provided but empty, return error.
    // Service: `if (typeof payload.username !== "string" || payload.username.trim().length < 3)`.
    // "" -> length 0. trim().length 0 < 3. Throws "username must be at least 3 characters".
    // Maps to 400.

    const updatedUser = await UserService.updateUserProfile(userId, payload);

    return sendResponse(res, {
      data: updatedUser,
      message: "profile updated",
      statusCodes: 200,
    });
  } catch (err) {
    console.error(err);
    if (err.message === "user not found") {
      return new ApiError(res, { message: "user not found", statuscode: 404 });
    }
    // Validation errors from service usually mean 400.
    // "username must be at least 3 characters"
    // "username cannot be thesame as your previous username"
    // "invalid username"
    // "bio must be a string"
    // "invalid age"
    // "invalid profileImageUrl"
    // "no valid fields provided for update"

    if (
      [
        "username must be at least 3 characters",
        "username cannot be thesame as your previous username",
        "invalid username",
        "bio must be a string",
        "invalid age",
        "invalid profileImageUrl",
        "no valid fields provided for update",
      ].includes(err.message)
    ) {
      return new ApiError(res, { message: err.message, statuscode: 400 });
    }

    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
