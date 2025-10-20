import dotenv from "dotenv";
dotenv.config();
export default {
  PORT: process.env.PORT,
  EMAIL_VALIDATOR_KEY: process.env.ABSTRACT_EMAIL_VALIDATOR_KEY,
  PG_PASSWORD: process.env.PG_PASSWORD,
  PG_USER: process.env.PG_USER,
  PG_HOST: process.env.PG_HOST,
  PG_PORT: process.env.PG_PORT,
  PG_DATABASE: process.env.PG_DATABASE,
  MAILER_EMAIL: process.env.MAILER_EMAIL,
  MAILER_PASSWORD: process.env.MAILER_PASSWORD,
  REDIS_PASSWORD: process.env.REDIS_PW,
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
};
