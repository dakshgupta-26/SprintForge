import { Request, Response, NextFunction } from 'express';

const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Safe HTTP methods don't mutate state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt public avatar retrieval/health or specific webhook routes if any
  if (req.path.startsWith('/api/health') || req.path.startsWith('/api/auth/avatar')) {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];
  const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];
  const secFetchSite = req.headers['sec-fetch-site'];

  // If Sec-Fetch-Site is present and says cross-site, reject if unallowed origin
  if (secFetchSite === 'cross-site') {
    if (!origin || !configuredOrigins.some((allowed) => origin === allowed || allowed === '*')) {
      return res.status(403).json({ message: 'Cross-Site request blocked by security policy' });
    }
  }

  // If origin is provided, verify it is allowed
  if (origin) {
    const isAllowed =
      configuredOrigins.includes(origin) ||
      configuredOrigins.includes('*') ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.vercel.app');

    if (!isAllowed) {
      return res.status(403).json({ message: 'CSRF verification failed: Origin not allowed' });
    }
  }

  next();
};
