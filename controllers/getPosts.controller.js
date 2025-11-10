import ApiError from "../utils/error.utils.js";
export default async (req, res) => {
  try {
    
  } catch (err) {
    return new ApiError(
      res,
      { statuscode: 500, message: err.message, errors: err },
      err
    );
  }
};
