import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import User, { IUser } from '../models/User';
import EmailVerificationChallenge from '../models/EmailVerificationChallenge';
import Session from '../models/Session';
import PasswordResetToken from '../models/PasswordResetToken';
import SecurityLog, { SecurityEventType } from '../models/SecurityLog';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/emailService';
import { parseDeviceInfo } from '../utils/deviceInfo';
import {
  getProfileImagesBucket,
  uploadBufferToGridFS,
  deleteGridFSFile,
} from '../utils/gridfs';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Configuration & Durations ────────────────────────────────────────────────
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '15m'; // Short-lived access token
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Token Helpers ────────────────────────────────────────────────────────────
export const generateAccessToken = (userId: string, sessionId?: string) => {
  return jwt.sign(
    { id: userId, sessionId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: ACCESS_TOKEN_EXPIRY } as any
  );
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto
    .createHash('sha256')
    .update(token + (process.env.JWT_SECRET || 'sprintforge_salt'))
    .digest('hex');
};

// ─── Cookie Helpers ───────────────────────────────────────────────────────────
const getCookieOptions = (maxAgeMs: number) => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd, // Requires HTTPS in production
    sameSite: (isProd ? 'none' : 'lax') as 'lax' | 'strict' | 'none',
    path: '/',
    maxAge: maxAgeMs,
  };
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  sessionId: string
) => {
  res.cookie('sf_access_token', accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
  res.cookie('sf_refresh_token', refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
  res.cookie('sf_session_id', sessionId, getCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));
};

export const clearAuthCookies = (res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  const clearOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'lax' | 'strict' | 'none',
    path: '/',
  };
  res.clearCookie('sf_access_token', clearOpts);
  res.clearCookie('sf_refresh_token', clearOpts);
  res.clearCookie('sf_session_id', clearOpts);
};

// ─── Security Log Helper ──────────────────────────────────────────────────────
const logSecurityEvent = async (opts: {
  userId?: any;
  email?: string;
  event: SecurityEventType;
  req: Request;
  status?: 'success' | 'failure' | 'warning';
  details?: string;
}) => {
  try {
    const device = parseDeviceInfo(opts.req);
    await SecurityLog.create({
      userId: opts.userId,
      email: opts.email,
      event: opts.event,
      ipAddress: device.ipAddress,
      userAgent: device.userAgent,
      browser: device.browser,
      os: device.os,
      deviceType: device.deviceType,
      status: opts.status || 'success',
      details: opts.details,
    });
  } catch (err) {
    console.error('Failed to write security log:', err);
  }
};

// ─── User Response DTO Sanitizer ──────────────────────────────────────────────
export const sanitizeUser = (user: any) => {
  if (!user) return null;
  const u = user.toObject ? user.toObject() : user;
  const hasPassword = Boolean(
    u.password ||
    (user.password !== undefined && user.password !== null && user.password !== '') ||
    (u.hasPassword !== undefined ? u.hasPassword : false)
  );
  delete u.password;
  delete u.__v;
  return {
    _id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    provider: u.provider || 'local',
    providerId: u.providerId,
    hasPassword,
    emailVerified: u.emailVerified,
    emailVerifiedAt: u.emailVerifiedAt,
    profileImage: u.profileImage,
    bio: u.bio,
    title: u.title,
    location: u.location,
    website: u.website,
    timezone: u.timezone,
    language: u.language,
    projects: u.projects,
    createdAt: u.createdAt,
    lastSeen: u.lastSeen,
  };
};


// Mask an email for security display (e.g. d****h@gmail.com)
const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal =
    local.length > 2
      ? local[0] + '*'.repeat(Math.min(local.length - 2, 4)) + local[local.length - 1]
      : local[0] + '***';
  return `${maskedLocal}@${domain}`;
};

// Cryptographically secure 6-digit OTP generator
const generateOtp = (): string => {
  return crypto.randomInt(100000, 1000000).toString();
};

// ─── 1. Register ──────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });

    // ── Handle existing UNVERIFIED account: allow re-registration / resend OTP ──
    if (existingUser && existingUser.emailVerified === false) {
      // Enforce 60-second resend cooldown to prevent email spam
      const existingChallenge = await EmailVerificationChallenge.findOne({ userId: existingUser._id });
      if (existingChallenge?.lastSentAt) {
        const elapsed = Date.now() - new Date(existingChallenge.lastSentAt).getTime();
        if (elapsed < 60000) {
          const remainingSeconds = Math.ceil((60000 - elapsed) / 1000);
          return res.status(429).json({
            message: `A verification code was recently sent. Please wait ${remainingSeconds}s before requesting a new one.`,
            remainingSeconds,
            unverifiedAccountExists: true,
          });
        }
      }

      const otp = generateOtp();
      const otpHash = hashToken(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await EmailVerificationChallenge.findOneAndUpdate(
        { userId: existingUser._id },
        {
          userId: existingUser._id,
          email: existingUser.email,
          otpHash,
          purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION',
          expiresAt,
          attempts: 0,
          lastSentAt: new Date(),
        },
        { upsert: true, new: true }
      );

      // Await email — only tell frontend it was sent if provider actually accepted it
      const emailResult = await sendOtpEmail({
        to: existingUser.email,
        name: existingUser.name,
        otp,
      });

      if (!emailResult.success) {
        console.error('❌ Register resend OTP email failed:', emailResult.error);
        return res.status(503).json({
          message: 'Unable to send verification email. Please try again in a moment.',
          emailSendFailed: true,
        });
      }

      console.log(`📧 Re-registration OTP resent to ${existingUser.email} (messageId: ${emailResult.messageId})`);

      await logSecurityEvent({
        userId: existingUser._id,
        email: existingUser.email,
        event: 'OTP_REQUESTED',
        req,
        details: 'Re-registration: resent OTP to unverified account',
      });

      const tempToken = jwt.sign(
        { userId: existingUser._id.toString(), email: existingUser.email, purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );

      return res.status(200).json({
        verificationRequired: true,
        tempToken,
        email: existingUser.email,
        maskedEmail: maskEmail(existingUser.email),
        message: 'This email has a pending verification. A new code has been sent to your inbox.',
      });
    }

    // ── Reject fully verified duplicate accounts ──
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      emailVerified: false,
      emailVerifiedAt: null,
    });

    // Generate secure 6-digit OTP for first-time email verification
    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailVerificationChallenge.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        email: user.email,
        otpHash,
        purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION',
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Await email — only tell frontend it was sent if provider actually accepted it
    const emailResult = await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    if (!emailResult.success) {
      // Email failed — the account is created and OTP is stored, but we must
      // tell the frontend the email was NOT delivered so it can show a retry UI
      console.error('❌ Registration OTP email failed:', emailResult.error);

      await logSecurityEvent({
        userId: user._id,
        email: user.email,
        event: 'OTP_REQUESTED',
        req,
        status: 'failure',
        details: `Registration OTP email failed to send: ${emailResult.error}`,
      });

      const tempToken = jwt.sign(
        { userId: user._id.toString(), email: user.email, purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );

      // Return 207 Multi-Status: account created, but email failed
      // Frontend must show retry UI, not a success screen
      return res.status(207).json({
        verificationRequired: true,
        emailSendFailed: true,
        tempToken,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        message: 'Account created, but we could not send the verification email. Please try resending.',
      });
    }

    console.log(`📧 Registration OTP sent to ${user.email} (messageId: ${emailResult.messageId})`);

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'OTP_REQUESTED',
      req,
      details: 'Account registration OTP sent successfully',
    });

    const tempToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    res.status(201).json({
      verificationRequired: true,
      emailSendFailed: false,
      tempToken,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      message: 'Account created! Please verify your email with the 6-digit code sent to your inbox.',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 2. Login ─────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password');

    // Generic error message to prevent email/account enumeration
    if (!user || !(await user.comparePassword(password))) {
      await logSecurityEvent({
        email: cleanEmail,
        event: 'LOGIN_FAILED',
        req,
        status: 'failure',
        details: 'Invalid email or password attempt',
      });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact support.' });
    }

    // Check if user email is verified
    if (user.emailVerified === false) {
      const otp = generateOtp();
      const otpHash = hashToken(otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await EmailVerificationChallenge.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          email: user.email,
          otpHash,
          purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION',
          expiresAt,
          attempts: 0,
          lastSentAt: new Date(),
        },
        { upsert: true, new: true }
      );

      sendOtpEmail({
        to: user.email,
        name: user.name,
        otp,
      }).catch((err) => console.error('Background OTP email dispatch error on login:', err));

      await logSecurityEvent({
        userId: user._id,
        email: user.email,
        event: 'OTP_REQUESTED',
        req,
        details: 'Login unverified email challenge triggered',
      });

      const tempToken = jwt.sign(
        { userId: user._id.toString(), email: user.email, purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION' },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );

      return res.json({
        verificationRequired: true,
        tempToken,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        message: 'First-time verification required. A 6-digit code has been sent to your email.',
      });
    }

    // Authenticated verified login — create server-side Session
    const sessionId = crypto.randomUUID();
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const device = parseDeviceInfo(req);

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS);

    await Session.create({
      sessionId,
      userId: user._id,
      refreshTokenHash,
      userAgent: device.userAgent,
      ipAddress: device.ipAddress,
      browser: device.browser,
      os: device.os,
      deviceType: device.deviceType,
      lastActiveAt: new Date(),
      expiresAt,
    });

    const accessToken = generateAccessToken(user._id.toString(), sessionId);
    setAuthCookies(res, accessToken, refreshToken, sessionId);

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'LOGIN_SUCCESS',
      req,
      details: `Signed in via ${device.browser} on ${device.os}`,
    });

    res.json({
      token: accessToken,
      sessionId,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 3. Verify Email OTP ──────────────────────────────────────────────────────
export const verifyEmailOtp = async (req: Request, res: Response) => {
  try {
    const { tempToken, otp, email } = req.body;
    if (!otp || otp.toString().trim().length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit verification code' });
    }

    let userId: string | null = null;

    if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret') as any;
        userId = decoded.userId;
      } catch {
        return res.status(401).json({ message: 'Verification session expired. Please sign in again.' });
      }
    } else if (email) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) userId = user._id.toString();
    }

    if (!userId) {
      return res.status(400).json({ message: 'Invalid verification request. Please sign in again.' });
    }

    const challenge = await EmailVerificationChallenge.findOne({ userId });
    if (!challenge) {
      return res.status(400).json({ message: 'Your verification code has expired. Please request a new one.' });
    }

    if (new Date() > challenge.expiresAt) {
      await challenge.deleteOne();
      return res.status(400).json({ message: 'Your verification code has expired. Please request a new one.' });
    }

    if (challenge.attempts >= 5) {
      await challenge.deleteOne();
      await logSecurityEvent({
        userId,
        event: 'OTP_FAILED',
        req,
        status: 'failure',
        details: 'Exceeded maximum 5 OTP verification attempts',
      });
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const submittedHash = hashToken(otp.toString().trim());

    if (submittedHash !== challenge.otpHash) {
      challenge.attempts += 1;
      await challenge.save();

      await logSecurityEvent({
        userId,
        event: 'OTP_FAILED',
        req,
        status: 'failure',
        details: `Incorrect OTP attempt (${challenge.attempts}/5)`,
      });

      const remainingAttempts = 5 - challenge.attempts;
      if (remainingAttempts <= 0) {
        await challenge.deleteOne();
        return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' });
      }

      return res.status(400).json({
        message: `That code isn't correct. Try again. (${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining)`,
      });
    }

    // OTP is valid!
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    // Invalidate challenge immediately
    await challenge.deleteOne();

    // Create authenticated session & HttpOnly cookies
    const sessionId = crypto.randomUUID();
    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);
    const device = parseDeviceInfo(req);

    await Session.create({
      sessionId,
      userId: user._id,
      refreshTokenHash,
      userAgent: device.userAgent,
      ipAddress: device.ipAddress,
      browser: device.browser,
      os: device.os,
      deviceType: device.deviceType,
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    });

    const accessToken = generateAccessToken(user._id.toString(), sessionId);
    setAuthCookies(res, accessToken, refreshToken, sessionId);

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'EMAIL_VERIFIED',
      req,
      details: 'Email successfully verified via OTP',
    });

    res.json({
      message: 'Email verified successfully! Welcome to SprintForge 🚀',
      token: accessToken,
      sessionId,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: error.message || 'Verification failed. Please try again.' });
  }
};

// ─── 4. Resend Email OTP ──────────────────────────────────────────────────────
export const resendEmailOtp = async (req: Request, res: Response) => {
  try {
    const { tempToken, email } = req.body;
    let userId: string | null = null;

    if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret') as any;
        userId = decoded.userId;
      } catch {
        return res.status(401).json({ message: 'Verification session expired. Please sign in again.' });
      }
    } else if (email) {
      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (user) userId = user._id.toString();
    }

    if (!userId) {
      return res.status(400).json({ message: 'Invalid request. Please sign in again.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ message: 'This email is already verified. Please sign in.' });
    }

    const challenge = await EmailVerificationChallenge.findOne({ userId });

    // Enforce 60-second cooldown
    if (challenge && challenge.lastSentAt) {
      const elapsed = Date.now() - new Date(challenge.lastSentAt).getTime();
      if (elapsed < 60000) {
        const remainingSeconds = Math.ceil((60000 - elapsed) / 1000);
        return res.status(429).json({
          message: `Please wait ${remainingSeconds}s before requesting another code.`,
          remainingSeconds,
        });
      }
    }

    const otp = generateOtp();
    const otpHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await EmailVerificationChallenge.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        email: user.email,
        otpHash,
        purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION',
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Await email — propagate failure honestly to the client
    const emailResult = await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    if (!emailResult.success) {
      console.error('❌ Resend OTP email failed:', emailResult.error);
      await logSecurityEvent({
        userId: user._id,
        email: user.email,
        event: 'OTP_REQUESTED',
        req,
        status: 'failure',
        details: `Resend OTP email failed: ${emailResult.error}`,
      });
      return res.status(503).json({
        message: 'Unable to send verification email. Please try again in a moment.',
        emailSendFailed: true,
      });
    }

    console.log(`📧 Resend OTP sent to ${user.email} (messageId: ${emailResult.messageId})`);

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'OTP_REQUESTED',
      req,
      details: 'Resent verification code successfully',
    });

    res.json({
      message: `A new 6-digit verification code was sent to ${maskEmail(user.email)} 📬`,
      emailSendFailed: false,
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to resend code' });
  }
};

// ─── 5. Refresh Token (Rotation & Reuse Detection) ────────────────────────────
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.sf_refresh_token || req.body?.refreshToken;
    if (!token) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'No refresh token provided.' });
    }

    const submittedHash = hashToken(token);

    // Find the session associated with this refresh token
    const session = await Session.findOne({ refreshTokenHash: submittedHash });

    if (!session) {
      // Possible token reuse attack or invalid token!
      clearAuthCookies(res);
      await logSecurityEvent({
        event: 'TOKEN_REUSE_DETECTED',
        req,
        status: 'warning',
        details: 'Attempted to refresh with an unrecognised or revoked refresh token',
      });
      return res.status(401).json({ message: 'Invalid or revoked session. Please sign in again.' });
    }

    if (session.revokedAt) {
      // Token reuse detected on a revoked session! Invalidate all sessions for user as security measure.
      await Session.updateMany({ userId: session.userId }, { revokedAt: new Date() });
      clearAuthCookies(res);
      await logSecurityEvent({
        userId: session.userId,
        event: 'TOKEN_REUSE_DETECTED',
        req,
        status: 'warning',
        details: 'Token reuse detected on revoked session. Revoked all user sessions for safety.',
      });
      return res.status(401).json({ message: 'Security alert: Session reuse detected. All sessions signed out.' });
    }

    if (new Date() > session.expiresAt) {
      session.revokedAt = new Date();
      await session.save();
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session has expired. Please sign in again.' });
    }

    const user = await User.findById(session.userId);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'User account not active.' });
    }

    // Refresh Token Rotation: Issue new refresh token and invalidate old one
    const newRefreshToken = generateRefreshToken();
    session.refreshTokenHash = hashToken(newRefreshToken);
    session.lastActiveAt = new Date();
    await session.save();

    const newAccessToken = generateAccessToken(user._id.toString(), session.sessionId);
    setAuthCookies(res, newAccessToken, newRefreshToken, session.sessionId);

    res.json({
      token: newAccessToken,
      sessionId: session.sessionId,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 6. Google SSO Auth ───────────────────────────────────────────────────────
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { credential, token } = req.body;
    const idToken = credential || token;

    if (!idToken) {
      return res.status(400).json({ message: 'Google credential / token is required' });
    }

    let payload: any = null;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (tokenInfoRes.ok) {
        payload = await tokenInfoRes.json();
      } else {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (userInfoRes.ok) {
          payload = await userInfoRes.json();
        } else {
          return res.status(401).json({ message: 'Invalid or expired Google authentication token' });
        }
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Unable to retrieve user information from Google' });
    }

    const { email, name, picture, sub } = payload;
    const cleanEmail = email.toLowerCase().trim();

    let user = await User.findOne({ email: cleanEmail });

    if (user) {
      if (!user.avatar && picture) user.avatar = picture;
      if (!user.providerId && sub) user.providerId = sub;
      user.emailVerified = true;
      if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: picture,
        provider: 'google',
        providerId: sub,
        role: 'member',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
      });
    }

    const sessionId = crypto.randomUUID();
    const refreshTokenVal = generateRefreshToken();
    const refreshTokenHash = hashToken(refreshTokenVal);
    const device = parseDeviceInfo(req);

    await Session.create({
      sessionId,
      userId: user._id,
      refreshTokenHash,
      userAgent: device.userAgent,
      ipAddress: device.ipAddress,
      browser: device.browser,
      os: device.os,
      deviceType: device.deviceType,
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS),
    });

    const accessToken = generateAccessToken(user._id.toString(), sessionId);
    setAuthCookies(res, accessToken, refreshTokenVal, sessionId);

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'LOGIN_SUCCESS',
      req,
      details: 'Signed in via Google SSO',
    });

    res.json({
      token: accessToken,
      sessionId,
      user: sanitizeUser(user),
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: error.message || 'Google authentication failed' });
  }
};

// ─── 7. Forgot Password ───────────────────────────────────────────────────────
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Please provide your account email' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    // Always respond with identical message to prevent account enumeration
    const genericResponse = {
      message: 'If an account exists with this email, password reset instructions have been sent.',
    };

    if (!user) {
      return res.json(genericResponse);
    }

    // Generate secure 32-byte hex reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await PasswordResetToken.create({
      userId: user._id,
      email: user.email,
      tokenHash,
      expiresAt,
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const resetUrl = `${clientUrl}/login?mode=reset&token=${resetToken}&email=${encodeURIComponent(user.email)}`;

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'PASSWORD_RESET_REQUESTED',
      req,
      details: 'Password reset link dispatched via email',
    });

    res.json(genericResponse);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 8. Reset Password ────────────────────────────────────────────────────────
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Token, email, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one number' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const tokenHash = hashToken(token);

    const resetDoc = await PasswordResetToken.findOne({
      tokenHash,
      email: cleanEmail,
      usedAt: null,
    });

    if (!resetDoc) {
      return res.status(400).json({ message: 'Invalid or expired password reset link.' });
    }

    if (new Date() > resetDoc.expiresAt) {
      await resetDoc.deleteOne();
      return res.status(400).json({ message: 'Password reset link has expired. Please request a new one.' });
    }

    const user = await User.findById(resetDoc.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    user.password = newPassword;
    await user.save();

    // Invalidate reset token
    resetDoc.usedAt = new Date();
    await resetDoc.save();

    // Revoke all existing active sessions for security
    await Session.updateMany({ userId: user._id }, { revokedAt: new Date() });
    clearAuthCookies(res);

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'PASSWORD_RESET_COMPLETED',
      req,
      details: 'Password successfully reset. Revoked all existing sessions.',
    });

    res.json({
      message: 'Password reset successfully! Please sign in with your new password.',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 9. Change Password (Authenticated) ───────────────────────────────────────
export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'New password must contain at least one number' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    // Revoke all other active sessions (keep current session active)
    if (req.sessionId) {
      await Session.updateMany(
        { userId: user._id, sessionId: { $ne: req.sessionId } },
        { revokedAt: new Date() }
      );
    }

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'PASSWORD_CHANGED',
      req,
      details: 'Password updated. Revoked all other active sessions.',
    });

    res.json({ message: 'Password updated successfully. Other active devices were signed out for security.' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 9b. Set Initial Password (for OAuth accounts without password) ───────────
export const setPassword = async (req: any, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/\d/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    user.password = newPassword;
    await user.save();

    await logSecurityEvent({
      userId: user._id,
      email: user.email,
      event: 'PASSWORD_CHANGED',
      req,
      details: 'Configured password for account. Email + Password login enabled.',
    });

    const sanitized = sanitizeUser(user);
    sanitized.hasPassword = true;

    res.json({
      message: 'Password set successfully! Email + Password login is now enabled.',
      user: sanitized,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// ─── 10. Get Active Sessions ──────────────────────────────────────────────────
export const getSessions = async (req: any, res: Response) => {
  try {
    const sessions = await Session.find({
      userId: req.user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ lastActiveAt: -1 });

    const formattedSessions = sessions.map((s) => ({
      sessionId: s.sessionId,
      browser: s.browser,
      os: s.os,
      deviceType: s.deviceType,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
      isCurrent: s.sessionId === req.sessionId,
    }));

    res.json(formattedSessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 11. Revoke Specific Session ──────────────────────────────────────────────
export const revokeSession = async (req: any, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const session = await Session.findOne({
      sessionId,
      userId: req.user._id,
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    session.revokedAt = new Date();
    await session.save();

    // If current session was revoked, clear cookies
    if (sessionId === req.sessionId) {
      clearAuthCookies(res);
    }

    await logSecurityEvent({
      userId: req.user._id,
      email: req.user.email,
      event: 'SESSION_REVOKED',
      req,
      details: `Revoked session (${session.browser} on ${session.os})`,
    });

    res.json({ message: 'Session revoked successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 12. Revoke All Other Sessions ────────────────────────────────────────────
export const revokeOtherSessions = async (req: any, res: Response) => {
  try {
    const currentSessionId = req.sessionId;
    const filter: any = { userId: req.user._id, revokedAt: null };
    if (currentSessionId) {
      filter.sessionId = { $ne: currentSessionId };
    }

    await Session.updateMany(filter, { revokedAt: new Date() });

    await logSecurityEvent({
      userId: req.user._id,
      email: req.user.email,
      event: 'REVOKE_ALL_SESSIONS',
      req,
      details: 'Signed out of all other active devices',
    });

    res.json({ message: 'All other sessions have been signed out successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 13. Get Security Audit Activity ──────────────────────────────────────────
export const getSecurityActivity = async (req: any, res: Response) => {
  try {
    const logs = await SecurityLog.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(25);

    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 14. Get Me ───────────────────────────────────────────────────────────────
export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id)
      .select('+password')
      .populate('projects', 'name key color icon');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const hasPassword = Boolean(user.password && user.password.length > 0);
    const sanitized: any = sanitizeUser(user);
    sanitized.hasPassword = hasPassword;
    res.json(sanitized);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


// ─── 15. Update Profile ───────────────────────────────────────────────────────
export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, bio, title, avatar, location, website, timezone, language } = req.body;

    if (avatar === '') {
      const existing = await User.findById(req.user._id);
      if (existing?.profileImage?.fileId) {
        await deleteGridFSFile(existing.profileImage.fileId);
      }
      const updated = await User.findByIdAndUpdate(
        req.user._id,
        {
          name,
          bio,
          title,
          avatar: '',
          $unset: { profileImage: 1 },
          location,
          website,
          timezone,
          language,
        },
        { new: true, runValidators: true }
      );
      return res.json(sanitizeUser(updated));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, title, avatar, location, website, timezone, language },
      { new: true, runValidators: true }
    );
    res.json(sanitizeUser(user));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── 16. Logout ───────────────────────────────────────────────────────────────
export const logout = async (req: any, res: Response) => {
  try {
    const sessionId = req.sessionId || req.cookies?.sf_session_id;
    if (sessionId) {
      await Session.findOneAndUpdate({ sessionId }, { revokedAt: new Date() });
    }

    if (req.user) {
      await logSecurityEvent({
        userId: req.user._id,
        email: req.user.email,
        event: 'LOGOUT',
        req,
        details: 'User logged out',
      });
    }

    clearAuthCookies(res);
    res.json({ message: 'Successfully logged out' });
  } catch (error: any) {
    clearAuthCookies(res);
    res.status(500).json({ message: error.message });
  }
};

// ─── 17. Avatar Handling ──────────────────────────────────────────────────────
export const uploadAvatar = async (req: any, res: Response) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'Please select a valid image file' });
    }

    const userId = req.user._id;
    const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
    const timestamp = Date.now();
    const safeFilename = `avatar_${userId}_${timestamp}${ext}`;
    const contentType = req.file.mimetype || 'image/jpeg';

    const gridFSFileId = await uploadBufferToGridFS(
      req.file.buffer,
      safeFilename,
      contentType
    );

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldFileId = currentUser?.profileImage?.fileId;
    const avatarUrl = `/api/auth/avatar/${userId}?v=${timestamp}`;

    currentUser.avatar = avatarUrl;
    currentUser.profileImage = {
      fileId: gridFSFileId as any,
      filename: safeFilename,
      contentType,
      uploadedAt: new Date(),
    };

    await currentUser.save({ validateBeforeSave: false });

    if (oldFileId) {
      try {
        await deleteGridFSFile(oldFileId);
      } catch (delErr) {
        console.warn('Could not clean up old GridFS avatar:', delErr);
      }
    }

    // Broadcast realtime profile update across open project rooms & chats
    const io = req.app.get('io');
    if (io) {
      io.emit('user:profile:updated', {
        userId: String(userId),
        avatar: avatarUrl,
        name: currentUser.name,
      });
    }

    res.json({
      message: 'Avatar updated successfully',
      avatarUrl,
      user: sanitizeUser(currentUser),
    });
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload avatar' });
  }
};

export const getAvatar = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If custom GridFS image exists
    if (user.profileImage?.fileId) {
      const fileId = new ObjectId(user.profileImage.fileId);
      const bucket = getProfileImagesBucket();

      res.setHeader('Content-Type', user.profileImage.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');

      const downloadStream = bucket.openDownloadStream(fileId);

      downloadStream.on('error', () => {
        if (!res.headersSent) {
          res.status(404).json({ message: 'Image not found in storage' });
        }
      });

      return downloadStream.pipe(res);
    }

    // If external URL (e.g. Google OAuth photo)
    if (user.avatar && (user.avatar.startsWith('http://') || user.avatar.startsWith('https://'))) {
      return res.redirect(user.avatar);
    }

    return res.status(404).json({ message: 'No profile image found' });
  } catch (error: any) {
    console.error('Get avatar error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error retrieving avatar' });
    }
  }
};

export const removeAvatar = async (req: any, res: Response) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.profileImage?.fileId) {
      try {
        await deleteGridFSFile(user.profileImage.fileId);
      } catch (delErr) {
        console.warn('Could not clean up GridFS avatar on delete:', delErr);
      }
    }

    user.avatar = '';
    user.profileImage = undefined;
    await user.save({ validateBeforeSave: false });

    // Broadcast realtime removal
    const io = req.app.get('io');
    if (io) {
      io.emit('user:profile:updated', {
        userId: String(userId),
        avatar: '',
        name: user.name,
      });
    }

    res.json({ message: 'Avatar removed successfully', user: sanitizeUser(user) });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to remove avatar' });
  }
};
