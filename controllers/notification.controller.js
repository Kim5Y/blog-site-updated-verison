import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";

export default async (req, res) => {
  try {
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
