import multer from "multer";
import { cloudinaryUploader } from "../config/cloudinary.js";

const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
});

export const uploadToCloudinary = (buffer, fileName, folder = "clinic") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryUploader.upload_stream(
      {
        folder: folder,
        public_id: `${Date.now()}-${fileName.split(".")[0]}`,
        resource_type: "auto",
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
};