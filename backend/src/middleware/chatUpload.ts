import multer from 'multer';
import path from 'path';

// Memory storage for streaming into MongoDB GridFS
const storage = multer.memoryStorage();

// Prohibited executable extensions for security
const BLOCKED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.vbs',
  '.msi',
  '.scr',
  '.com',
  '.pif',
  '.hta',
  '.cpl',
]);

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (BLOCKED_EXTENSIONS.has(ext)) {
    return cb(new Error('Executable and script files are not permitted for security reasons.'));
  }

  // Prevent path traversal in originalname
  file.originalname = path.basename(file.originalname).replace(/[\/\\]/g, '_');

  cb(null, true);
};

// 25 MB max attachment size
export const chatAttachmentUpload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB
  },
  fileFilter,
});
