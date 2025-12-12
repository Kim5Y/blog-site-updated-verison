import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { client } from "./redis.config.js";
import ApiError from "../utils/error.utils.js";
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
  }),
  handler: (req, res) => {
    return new ApiError(res, {
      message: "Too many requests, please try again later",
      statuscode: 429,
    });
  },
});

export const mediumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
  }),
  handler: (req, res) => {
    return new ApiError(res, {
      message: "Too many requests, please try again later",
      statuscode: 429,
    });
  },
});

export const flexibleLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => client.sendCommand(args),
  }),
  handler: (req, res) => {
    return new ApiError(res, {
      message: "Too many requests, please try again later",
      statuscode: 429,
    });
  },
});
