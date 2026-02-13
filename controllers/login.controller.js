import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as AuthService from "../services/auth.service.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return new ApiError(res, {
        message: "All input fields cannot be empty",
        statuscode: 400,
      });

    const result = await AuthService.loginUser({ email, password });

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return sendResponse(res, {
      statusCodes: 200,
      data: { token: result.accessToken },
    });
  } catch (err) {
    console.log(err);
    return new ApiError(
      res,
      {
        message: err.message,
        statuscode: 500,
      },
      err,
    );
  }
};
