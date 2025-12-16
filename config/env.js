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
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  PG_DATABASE_URL: process.env.DATABASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  NEON_DB: process.env.NEON_PSQL_DB,
};
