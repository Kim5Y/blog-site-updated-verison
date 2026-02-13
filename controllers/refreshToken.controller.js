import sendResponse from "../utils/sendResponse.util.js";
import ApiError from "../utils/error.utils.js";
import * as AuthService from "../services/auth.service.js";

export default async (req, res) => {
  try {
    const { refresh_token } = req.cookies;
    if (!refresh_token)
      return new ApiError(res, {
        status: 403,
        message: "invalid refresh token",
      });

    const result = await AuthService.refreshAccessToken({ refresh_token });

    return sendResponse(res, { data: { token: result.accessToken } });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, statuscode: 500 }, err);
  }
};
