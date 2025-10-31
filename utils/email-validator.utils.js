import env from "../config/env.js";
import axios from "axios";
const API_KEY = env.EMAIL_VALIDATOR_KEY;
export default async (userEmail) => {
  try {
    const response = await axios.get(
      `https://emailreputation.abstractapi.com/v1/?api_key=${API_KEY}&email=${userEmail}`
    );
    return response;
  } catch (error) {
    return console.log("from function :", error);
  }
};
