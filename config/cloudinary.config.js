import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import env from "./env.js";
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

const imageUrl = async (rowImage) => {
  return new Promise((resolve, reject) => {
    try {
      if (!rowImage || !rowImage.buffer)
        return reject(new Error("Invalid file"));
      const buffer = Buffer.isBuffer(rowImage.buffer)
        ? rowImage.buffer
        : Buffer.from(rowImage.buffer);
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "postImages" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result?.secure_url);
        }
      );
      uploadStream.on("error", (err) => {
        reject(err);
      });
      streamifier.createReadStream(buffer).pipe(uploadStream);
    } catch (err) {
      reject(err);
    }
  });
};

export default imageUrl;

// try {
//     const results = await cloudinary.uploader.upload_stream(rowImage);
//     return cloudinary.url(results.public_id, {
//       transformation: [
//         {
//           quality: auto,
//           fetch_format: auto,
//         },
//         {
//           quality: auto,
//         },
//         {
//           width: 1200,
//           height: 1200,
//           crop: "fill",
//           gravity: "auto",
//         },
//       ],
//     });
//   } catch (error) {
//     console.log("error from cloudinary:", error);
//   }
