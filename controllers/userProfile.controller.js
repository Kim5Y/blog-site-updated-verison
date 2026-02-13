import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as UserService from "../services/user.service.js";

export default async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const response = await UserService.getUserProfile(userId, page, limit);

    return sendResponse(res, response);
  } catch (err) {
    console.log(err);
    if (err.message === "invalid user id" || err.message === "invalid userId") {
    }
    if (err.message === "user not found") {
      return new ApiError(res, { statuscode: 404, message: "user not found" });
    }
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const logout = async (req, res) => {
  try {
    const cookiesRefreshToken = req.cookies.refresh_token;
    if (cookiesRefreshToken) {
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
      });
    }

    await UserService.logout(req.user.id, cookiesRefreshToken);

    return sendResponse(res, { message: "logged out successfully" });
  } catch (err) {
    console.log(err);
    return new ApiError(err, { message: err.message, errors: err }, err);
  }
};
