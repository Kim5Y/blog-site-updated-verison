import env from "../config/env.js";
import axios from "axios";
const API_KEY = env.EMAIL_VALIDATOR_KEY;
export default async (userEmail) => {
  try {
    const response = await axios.get(
      `https://emailreputation.abstractapi.com/v1/?api_key=${API_KEY}&email=${userEmail}`
    );
    const data = JSON.parse(response);
    console.log(data);
  } catch (error) {
    return console.log(error);
  }
};