import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

/**
 * Recursively cleans an object by stripping any keys starting with '$' or containing '.'
 * to prevent NoSQL / MongoDB query operator injection.
 */
function cleanNoSqlOperators(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanNoSqlOperators);
  }

  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    // Strip keys with $ or . to prevent operator injection
    if (key.startsWith('$') || key.includes('.')) {
      continue;
    }
    cleaned[key] = cleanNoSqlOperators(obj[key]);
  }
  return cleaned;
}

export const mongoSanitize = (req: Request, res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = cleanNoSqlOperators(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = cleanNoSqlOperators(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = cleanNoSqlOperators(req.params);
  }
  next();
};

/**
 * Validates that string parameters meant to be MongoDB ObjectIds are valid 24-character hex strings.
 */
export const validateObjectId = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName] || req.body[paramName] || req.query[paramName];
    if (id && !mongoose.Types.ObjectId.isValid(String(id))) {
      return res.status(400).json({ message: `Invalid ID format for ${paramName}` });
    }
    next();
  };
};
