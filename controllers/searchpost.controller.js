import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import * as PostService from "../services/post.service.js";
import * as UserService from "../services/user.service.js";

export default async (req, res) => {
  try {
    const query = (req.query.query || "")?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const postResult = await PostService.searchPosts(query, limit, offset);
    const usersResult = await UserService.searchUsers(query, limit, offset);

    const results = {
      postResult,
      usersResult,
      meta: {
        query,
        page,
        limit,
        offset,
      },
    };

    // Redis caching logic was commented out in original controller.
    // I'll leave it out or implement it?
    // "await client.setEx(redistKey, 60, JSON.stringify(results));" was commented out.
    // So I won't implement it.

    return sendResponse(res, { data: { postResult, usersResult } });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
