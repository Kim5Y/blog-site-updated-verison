import { v2 as cloudinary } from "cloudinary";
import env from "./env.js";
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});
const imageUrl = async (rowImageUrl) => {
  try {
    const results = await cloudinary.uploader.upload(rowImageUrl);
    return cloudinary.url(results.public_id, {
      transformation: [
        {
          quality: auto,
          fetch_format: auto,
        },
        {
          width: 1200,
          height: 1200,
          crop: "fill",
          gravity: "auto"
        },
      ],
    });
  } catch (error) {
    console.log("error from cloudinary:", error);
  }
};
