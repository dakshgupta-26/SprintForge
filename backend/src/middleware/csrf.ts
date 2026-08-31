import { Request, Response, NextFunction } from 'express';

const configuredOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true;
  return (
    configuredOrigins.includes(origin) ||
    configuredOrigins.includes('*') ||
    origin === 'https://sprint-forge-livid.vercel.app' ||
    origin.endsWith('.vercel.app') ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  );
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Safe HTTP methods don't mutate state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt public avatar retrieval/health or specific routes
  if (
    req.path.startsWith('/api/health') ||
    req.path.startsWith('/health') ||
    req.path.startsWith('/api/auth/avatar')
  ) {
    return next();
  }

  const origin = req.headers['origin'] as string | undefined;
  const referer = req.headers['referer'] as string | undefined;
  const secFetchSite = req.headers['sec-fetch-site'];

  let refererOrigin: string | undefined;
  if (referer) {
    try {
      refererOrigin = new URL(referer).origin;
    } catch {
      // invalid referer URL
    }
  }

  // If Sec-Fetch-Site is present and cross-site, verify origin or referer is an allowed client
  if (secFetchSite === 'cross-site') {
    const candidateOrigin = origin || refererOrigin;
    if (!candidateOrigin || !isOriginAllowed(candidateOrigin)) {
      return res.status(403).json({ message: 'Cross-Site request blocked by security policy' });
    }
  }

  // If origin is provided, verify it is allowed
  if (origin && !isOriginAllowed(origin)) {
    return res.status(403).json({ message: 'Origin not allowed by security policy' });
  }

  next();
};

