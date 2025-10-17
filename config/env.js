import dotenv from "dotenv";
dotenv.config();
export default {
    PORT: process.env.PORT,
    EMAIL_VALIDATOR_KEY: process.env.ABSTRACT_EMAIL_VALIDATOR_KEY
}