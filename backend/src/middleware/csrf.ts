import { Request, Response, NextFunction } from 'express';

const getConfiguredOrigins = (): string[] => {
  return (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
};

export const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin || origin === 'null') return true;

  const configuredOrigins = getConfiguredOrigins();
  const normalized = origin.trim().replace(/\/+$/, '').toLowerCase();

  if (
    configuredOrigins.some(
      (allowed) => allowed === '*' || allowed.trim().replace(/\/+$/, '').toLowerCase() === normalized
    )
  ) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.onrender.com') ||
      hostname === 'sprint-forge-livid.vercel.app'
    ) {
      return true;
    }
  } catch {
    if (
      normalized.includes('.vercel.app') ||
      normalized.includes('.onrender.com') ||
      normalized.includes('localhost') ||
      normalized.includes('127.0.0.1')
    ) {
      return true;
    }
  }

  return false;
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

