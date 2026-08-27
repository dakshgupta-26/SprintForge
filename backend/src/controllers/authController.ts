import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import User from '../models/User';
import EmailVerificationChallenge from '../models/EmailVerificationChallenge';
import { sendOtpEmail } from '../services/emailService';
import {
  getProfileImagesBucket,
  uploadBufferToGridFS,
  deleteGridFSFile,
} from '../utils/gridfs';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as any);
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

// One-way cryptographic hash of OTP with server secret
const hashOtp = (otp: string): string => {
  return crypto
    .createHash('sha256')
    .update(otp + (process.env.JWT_SECRET || 'sprintforge_salt'))
    .digest('hex');
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      emailVerified: false,
      emailVerifiedAt: null,
    });

    // Generate secure 6-digit OTP for first-time email verification
    const otp = generateOtp();
    const otpHash = hashOtp(otp);
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

    // Send transactional verification email
    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    const tempToken = jwt.sign(
      { userId: user._id.toString(), email: user.email, purpose: 'FIRST_LOGIN_EMAIL_VERIFICATION' },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '15m' }
    );

    res.status(201).json({
      verificationRequired: true,
      tempToken,
      email: user.email,
      maskedEmail: maskEmail(user.email),
      message: 'Account created! Please verify your email with the 6-digit code sent to your inbox.',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user email is verified
    if (user.emailVerified === false) {
      // First-time login: generate and send OTP
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
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

      await sendOtpEmail({
        to: user.email,
        name: user.name,
        otp,
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

    // Normal authenticated login for verified accounts
    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });
    const token = generateToken(user._id.toString());
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        profileImage: user.profileImage,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Verify Email OTP Endpoint
 */
export const verifyEmailOtp = async (req: Request, res: Response) => {
  try {
    const { tempToken, otp, email } = req.body;
    if (!otp || otp.toString().trim().length !== 6) {
      return res.status(400).json({ message: 'Please enter a valid 6-digit verification code' });
    }

    let userId: string | null = null;
    let tokenEmail: string | null = null;

    if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'secret') as any;
        userId = decoded.userId;
        tokenEmail = decoded.email;
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
      return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const submittedHash = hashOtp(otp.toString().trim());

    if (submittedHash !== challenge.otpHash) {
      challenge.attempts += 1;
      await challenge.save();

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

    // Generate production authentication token
    const token = generateToken(user._id.toString());

    res.json({
      message: 'Email verified successfully! Welcome to SprintForge 🚀',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        profileImage: user.profileImage,
      },
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: error.message || 'Verification failed. Please try again.' });
  }
};

/**
 * Resend Email OTP Endpoint with 60-Second Cooldown
 */
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
    const otpHash = hashOtp(otp);
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

    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
    });

    res.json({
      message: `A new 6-digit verification code was sent to ${maskEmail(user.email)} 📬`,
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: error.message || 'Failed to resend code' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).populate('projects', 'name key color icon');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: any, res: Response) => {
  try {
    const { name, bio, title, avatar, location, website, timezone, language } = req.body;
    
    // If removing avatar
    if (avatar === "") {
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
          avatar: "",
          $unset: { profileImage: 1 },
          location,
          website,
          timezone,
          language,
        },
        { new: true, runValidators: true }
      );
      return res.json(updated);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, title, avatar, location, website, timezone, language },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: any, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    const token = generateToken(user._id.toString());
    res.json({ token, message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

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
    const oldFileId = currentUser?.profileImage?.fileId;

    const avatarUrl = `/api/auth/avatar/${userId}?v=${timestamp}`;

    currentUser!.avatar = avatarUrl;
    currentUser!.profileImage = {
      fileId: gridFSFileId as any,
      filename: safeFilename,
      contentType,
      uploadedAt: new Date(),
    };

    await currentUser!.save({ validateBeforeSave: false });

    if (oldFileId) {
      await deleteGridFSFile(oldFileId);
    }

    res.json({
      message: 'Avatar updated successfully',
      avatarUrl,
      user: currentUser,
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
    if (!user || !user.profileImage?.fileId) {
      return res.status(404).json({ message: 'No profile image found' });
    }

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

    downloadStream.pipe(res);
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
      await deleteGridFSFile(user.profileImage.fileId);
    }

    user.avatar = "";
    user.profileImage = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Avatar removed successfully', user });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to remove avatar' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Successfully logged out' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

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

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.avatar && picture) user.avatar = picture;
      if (!user.providerId && sub) user.providerId = sub;
      user.emailVerified = true;
      if (!user.emailVerifiedAt) user.emailVerifiedAt = new Date();
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        avatar: picture,
        provider: 'google',
        providerId: sub,
        role: 'member',
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
      });
    }

    const jwtToken = generateToken(user._id.toString());

    res.json({
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        provider: user.provider,
        emailVerified: user.emailVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        profileImage: user.profileImage,
      },
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: error.message || 'Google authentication failed' });
  }
};
