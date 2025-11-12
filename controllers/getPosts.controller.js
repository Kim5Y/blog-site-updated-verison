import ApiError from "../utils/error.utils.js";
import sendResponse from "../utils/sendResponse.util.js";
import { getPaginatedPosts, getPostCount } from "../model/getPost.model.js";
import { client } from "../config/redis.config.js";
import { getIO } from "../index.js";

export default async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const io = getIO(res);
    const cacheKey = `post:page:${page}:limit:${limit}`;
    const cachedPostsExists = await client.get(cacheKey);
    if (cachedPostsExists) {
      console.log("fetched from cache..");
      const redisData = JSON.parse(cachedPostsExists);
      return sendResponse(res, {
        data: redisData.data,
        meta: redisData.meta,
      });
    }
    console.log("fetching from normal db");
    const posts = await getPaginatedPosts(limit, offset);
    const postCount = await getPostCount();
    const response = {
      data: posts,
      meta: {
        page,
        limit,
        offset,
        totalPageCount: Math.ceil(postCount / limit),
      },
    };
    await client.setEx(cacheKey, 60, JSON.stringify(response));
    return sendResponse(res, { data: response.data, meta: response.meta });
  } catch (err) {
    return new ApiError(
      res,
      { statuscode: 500, message: err.message, errors: err },
      err
    );
  }
};