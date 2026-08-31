import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const isDev = process.env.NODE_ENV === 'development';
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    return res.status(400).json({
      message: 'Invalid resource identifier format.',
    });
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'email';
    return res.status(409).json({
      message: `An account with this ${field} already exists.`,
    });
  }

  // Handle Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum allowed size is 5MB.' });
    }
    return res.status(400).json({ message: err.message || 'File upload error.' });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid authentication token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Authentication token has expired.' });
  }

  if (isDev) {
    console.error('⚠️ [Server Error]:', err);
  }

  // Production-safe response
  res.status(statusCode).json({
    message: err.message || 'An unexpected error occurred. Please try again later.',
    stack: isDev ? err.stack : undefined,
  });
};
