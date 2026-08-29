import rateLimit from 'express-rate-limit';

// Standard general rate limiter for general auth endpoints
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Targeted rate limiter for Login to protect against credential stuffing & brute-force
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per 15 minutes per IP
  message: { message: 'Too many failed login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts towards lockout
});

// Targeted rate limiter for OTP verification
export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  message: { message: 'Too many verification attempts. Please wait a few minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Targeted rate limiter for OTP generation & resend (anti-spam / email bombing defense)
export const otpResendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many verification code requests. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Targeted rate limiter for Password Reset requests
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Too many password reset requests. Please wait a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
