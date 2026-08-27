import multer from 'multer';
import path from 'path';

// Use memory storage so file buffers are passed directly to MongoDB GridFS
const storage = multer.memoryStorage();

// Validate image type
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype || extname) {
    cb(null, true);
  } else {
    cb(new Error('Only web images (jpeg, jpg, png, webp, gif) are allowed!'));
  }
};

// Initialize upload middleware with 5MB limit
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter,
});
