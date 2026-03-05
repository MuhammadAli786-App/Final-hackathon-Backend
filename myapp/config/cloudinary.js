import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const cloudinaryConfig = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
    secure: true,
  });
};

 const cloudinaryUploader = cloudinary.uploader;

export { cloudinaryConfig, cloudinaryUploader };

