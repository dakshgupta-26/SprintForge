import { Request } from 'express';

export interface DeviceInfo {
  userAgent: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  ipAddress: string;
}

export function parseDeviceInfo(req: Request): DeviceInfo {
  const userAgent = req.headers['user-agent'] || 'Unknown Device';
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket?.remoteAddress || '127.0.0.1';

  // Sanitize IP (handle IPv6 mapped IPv4 e.g. ::ffff:127.0.0.1)
  const ipAddress = rawIp.replace(/^.*:/, '') || '127.0.0.1';

  // Browser detection
  let browser = 'Browser';
  if (/Edg/i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(userAgent)) browser = 'Google Chrome';
  else if (/Firefox/i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/Safari/i.test(userAgent)) browser = 'Apple Safari';
  else if (/Opera|OPR/i.test(userAgent)) browser = 'Opera';

  // OS detection
  let os = 'Desktop OS';
  if (/Windows/i.test(userAgent)) os = 'Windows';
  else if (/Macintosh|Mac OS/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

  // Device type detection
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  if (/Tablet|iPad/i.test(userAgent)) deviceType = 'tablet';
  else if (/Mobile|Android|iPhone/i.test(userAgent)) deviceType = 'mobile';

  return {
    userAgent,
    browser,
    os,
    deviceType,
    ipAddress,
  };
}
