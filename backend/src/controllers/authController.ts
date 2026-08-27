import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { ObjectId } from 'mongodb';
import User from '../models/User';
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

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id.toString());
    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
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
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
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
        profileImage: user.profileImage,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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

/**
 * Upload Avatar to MongoDB GridFS with automatic cleanup of old image
 */
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

    // 1. Upload buffer to MongoDB GridFS bucket "profileImages"
    const gridFSFileId = await uploadBufferToGridFS(
      req.file.buffer,
      safeFilename,
      contentType
    );

    // 2. Fetch current user to check for old image to clean up
    const currentUser = await User.findById(userId);
    const oldFileId = currentUser?.profileImage?.fileId;

    // 3. Update user document with persistent URL and GridFS reference
    const avatarUrl = `/api/auth/avatar/${userId}?v=${timestamp}`;

    currentUser!.avatar = avatarUrl;
    currentUser!.profileImage = {
      fileId: gridFSFileId as any,
      filename: safeFilename,
      contentType,
      uploadedAt: new Date(),
    };

    await currentUser!.save({ validateBeforeSave: false });

    // 4. Clean up old GridFS image file if it existed
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

/**
 * Stream persistent avatar image from MongoDB GridFS
 */
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

    downloadStream.on('error', (err) => {
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

/**
 * Remove Avatar from MongoDB GridFS
 */
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
        profileImage: user.profileImage,
      },
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: error.message || 'Google authentication failed' });
  }
};
