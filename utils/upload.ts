import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { Response } from 'express-serve-static-core';
import "dotenv/config";
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.csv', '.txt', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('File type is not supported') as unknown as null, false); // Type assertion added here
    }

    cb(null, true);
  },
});

const retryCloudinaryUpload = async (filePath: string, options = {}, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
      try {
          const result = await cloudinary.uploader.upload(filePath, options);
          return result;
      } catch (error) {
          if (i === retries - 1) {
              throw error;
          }
          console.error(`Upload failed, retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
      }
  }
};

export const handleFileUpload = async (req: any, res: Response) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'File upload failed' });
    }

    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      let result;
      const fileExtension = path.extname(uploadedFile.originalname).toLowerCase();

      if (['.jpg', '.jpeg', '.png'].includes(fileExtension)) {
        // Handle image upload
        result = await retryCloudinaryUpload(uploadedFile.path);
      } else {
        // Handle other file types (raw upload)
        result = await retryCloudinaryUpload(uploadedFile.path, { resource_type: 'raw' });
      }
        const data = {
            title: uploadedFile.originalname,
            url: result?.secure_url
        }
      return res.status(200).send(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
}