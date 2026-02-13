import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as PostService from "../services/post.service.js";

export const createPosts = async (req, res) => {
  try {
    const { title, content, category, image_url } = req.body;

    // Validation is partly in service, but controller can do basic check
    if (!title || !content || !category)
      return new ApiError(res, {
        statuscode: 400,
        message: "input fields cannot be empty",
      });

    const newPost = await PostService.createPost(
      req.user.id,
      { title, content, category, image_url },
      req,
    );

    return sendResponse(res, {
      statuscode: 201,
      message: "post created successfully",
      data: { newPost },
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
