import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import { searchPost, searchUsers } from "../model/getPost.model.js";
import { client } from "../config/redis.config.js";
export default async (req, res) => {
  try {
    const query = (req.query.query || "")?.trim();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    // console.log({ query });
    // const redistKey = `searchResults:page:${page}:limit:${limit}:offset:${offset}`;
    // const cachedData = await client.get(redistKey);
    // if (cachedData) {
    //   const data = JSON.parse(cachedData);
    //   return sendResponse(res, { data: data });
    // }
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
    // await client.setEx(redistKey, 60, JSON.stringify(results));
    return sendResponse(res, { data: { postResult, usersResult } });
  } catch (err) {
    console.log(err);
    return new ApiError(res, { message: err.message, errors: err }, err);
  }
};
