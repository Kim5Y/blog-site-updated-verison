import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import { searchPost, searchUsers } from "../model/getPost.model.js";
import { client } from "./redis.config.js";
export default async (req, res) => {
  try {
    const query = (req.query.query || "")?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    console.log({ query, page, limit, offset });
    const redistKey = `searchResults:page:${page}:limit:${limit}:offset:${offset}`;

    const cachedData = await client.get(redistKey);
    if (cachedData) {
      console.log("fetching from redis");
      const data = JSON.parse(cachedData);
      return sendResponse(res, { data: data });
    }
    console.log("fetching from database");
    const postResult = await searchPost(query, limit, offset);
    const usersResult = await searchUsers(query, limit, offset);
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
    await client.setEx(redistKey, 60, JSON.stringify(results));
    return res.status(200).json({ postResult, usersResult });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
