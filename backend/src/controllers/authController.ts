import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';

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
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
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
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    // The file is saved automatically by multer; construct its accessible URL
    const avatarUrl = `/uploads/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    );
    
    res.json({ message: 'Avatar updated', user, avatarUrl });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // With stateless JWT, we simply acknowledge logout logic from the server side.
    // The client is responsible for deleting the token and closing WS.
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

    // First attempt: verify via google-auth-library
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID || undefined,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      // Fallback: verify via Google tokeninfo endpoint (useful if client ID is flexible or token is an access token)
      const tokenInfoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (tokenInfoRes.ok) {
        payload = await tokenInfoRes.json();
      } else {
        // Also check if it was an access token
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

    // Check if user already exists with this email
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // Update profile info if missing
      if (!user.avatar && picture) user.avatar = picture;
      if (!user.providerId && sub) user.providerId = sub;
      user.lastSeen = new Date();
      await user.save({ validateBeforeSave: false });
    } else {
      // Create new user with Google provider
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
      },
    });
  } catch (error: any) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: error.message || 'Google authentication failed' });
  }
};

