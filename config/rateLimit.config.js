import rateLimit from "express-rate-limit";
export const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 7,
  standardHeaders: true,
  legacyHeaders: false,
//   store: new RedisStore({
//     sendCommand: (...args) => client.sendCommand(args),
//   }),
});

export const mediumLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
//   store: new RedisStore({
//     sendCommand: (...args) => client.sendCommand(args),
//   }),
});

export const flexibleLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 400,
  standardHeaders: true,
  legacyHeaders: false,
//   store: new RedisStore({
//     sendCommand: (...args) => client.sendCommand(args),
//   }),
});
