import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as AuthService from "../services/auth.service.js";

export const sendOtp = async (req, res) => {
  try {
    const { username, email, password, categories } = req.body;
    if (!username || !email || !password || !categories) {
      return new ApiError(res, {
        statuscode: 400,
        message: "input field cannot be empty",
      });
    }

    const result = await AuthService.sendOtp({
      username,
      email,
      password,
      categories,
    });

    return sendResponse(res, {
      message: result.message,
      statusCodes: 200,
    });
  } catch (err) {
    return new ApiError(
      res,
      {
        statuscode: 500,
        message: err.message,
        errors: err,
      },
      err,
    );
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body;
    if (!email || !otpCode)
      return new ApiError(res, {
        statuscode: 400,
        message: "input cannot be empty",
      });

    const result = await AuthService.verifyOtpAndCreateUser({ email, otpCode });

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return sendResponse(res, {
      statusCodes: 201,
      message: "user successfully created",
      data: { token: result.accessToken },
    });
  } catch (err) {
    console.log(err);
    return new ApiError(
      res,
      {
        statuscode: 500,
        message: err.message,
        errors: err,
      },
      err,
    );
  }
};
