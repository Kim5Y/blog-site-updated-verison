import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as AuthService from "../services/auth.service.js";

export default async (req, res) => {
  try {
    let { email } = req.body;
    if (!email || typeof email !== "string")
      return new ApiError(res, {
        message: "email cannot be empty",
        statuscode: 400,
      });
    email = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return new ApiError(res, {
        message: "invalid email format",
        statuscode: 400,
      });

    const result = await AuthService.sendPasswordResetOtp(email);

    res.cookie("session_token", result.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return sendResponse(res, {
      message: `OTP code successfully sent to ${email}, expires in 6minutes`,
      statusCodes: 200,
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const verifyPasswordOtp = async (req, res) => {
  try {
    let { email, otpCode } = req.body;
    const sessionToken = req.cookies.session_token;
    if (!email || typeof email !== "string")
      return new ApiError(res, {
        message: "email cannot be empty",
        statuscode: 400,
      });
    if (!sessionToken)
      return new ApiError(res, {
        message: "session key not found",
        statuscode: 404,
      });
    if (typeof otpCode !== "number")
      return new ApiError(res, {
        message: "invalid otp code",
        statuscode: 400,
      });
    email = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return new ApiError(res, {
        message: "invalid email format",
        statuscode: 400,
      });
    const otpCodeStr = String(otpCode).trim();
    if (!/^\d+$/.test(otpCodeStr))
      return new ApiError(res, {
        message: "OTP code must contain only digits",
        statuscode: 400,
      });

    if (otpCodeStr.length < 4 || otpCodeStr.length > 6)
      return new ApiError(res, {
        message: "OTP code must be 4-6 digits",
        statuscode: 400,
      });

    await AuthService.verifyPasswordOtp({
      email,
      otpCode: otpCodeStr,
      sessionToken,
    });

    return res.sendStatus(200);
  } catch (err) {
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const sessionToken = req.cookies.session_token;
    if (!sessionToken)
      return new ApiError(res, {
        message: "session key not found",
        statuscode: 404,
      });
    if (!password)
      return new ApiError(res, {
        message: "password input cannot be empty",
        statuscode: 400,
      });
    const minLength = 8;

    if (password.length < minLength) {
      return {
        valid: false,
        message: "Password must be at least 8 characters long.",
      };
    }

    if (!/[A-Z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one uppercase letter.",
      };
    }

    if (!/[a-z]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one lowercase letter.",
      };
    }

    if (!/[0-9]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one number.",
      };
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        valid: false,
        message: "Password must contain at least one special character.",
      };
    }

    await AuthService.resetPassword({ password, sessionToken });

    res.clearCookie("session_token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return sendResponse(res, { message: "password updated", statusCodes: 201 });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const sendResetEmailOtp = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email || typeof email !== "string")
      return new ApiError(res, {
        message: "email cannot be empty",
        statuscode: 400,
      });
    email = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return new ApiError(res, {
        message: "invalid email format",
        statuscode: 400,
      });

    const result = await AuthService.sendEmailUpdateOtp(email);

    res.cookie("new_email", result.email, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return sendResponse(res, {
      message: `OTP code successfully sent to ${email}, expires in 6minutes`,
      statusCodes: 200,
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};

export const verifyEmailResetOtp = async (req, res) => {
  try {
    const { otpCode } = req.body;
    const email = req.cookies.new_email;
    const userId = req.user.id;
    if (!email)
      return new ApiError(res, { message: "email not found", statuscode: 404 });
    if (!otpCode)
      return new ApiError(res, {
        message: "input cannot be empty",
        statuscode: 400,
      });
    const OTP = parseInt(otpCode);
    if (isNaN(OTP))
      return new ApiError(res, {
        message: "invalid otp code",
        statuscode: 400,
      });

    const otpCodeStr = String(otpCode).trim();
    if (!/^\d+$/.test(otpCodeStr))
      return new ApiError(res, {
        message: "OTP code must contain only digits",
        statuscode: 400,
      });

    if (otpCodeStr.length < 4 || otpCodeStr.length > 6)
      return new ApiError(res, {
        message: "OTP code must be 4-6 digits",
        statuscode: 400,
      });

    const updatedEmail = await AuthService.verifyEmailUpdateOtp({
      otpCode: otpCodeStr,
      email,
      userId,
    });

    return sendResponse(res, {
      message: "email updated  successfully",
      statusCodes: 201,
      data: updatedEmail,
    });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
