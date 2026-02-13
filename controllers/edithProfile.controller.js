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
