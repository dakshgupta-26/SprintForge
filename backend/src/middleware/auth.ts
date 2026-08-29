import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import Session, { ISession } from '../models/Session';

export interface AuthRequest extends Request {
  user: IUser;
  sessionId?: string;
  sessionDoc?: ISession;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Check HttpOnly cookie first, fallback to Authorization header
    let token: string | undefined = req.cookies?.sf_access_token;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please sign in.' });
    }

    // 2. Verify JWT signature & validity
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    } catch (jwtErr: any) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Session expired. Please sign in again or refresh your session.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Invalid authentication token.', code: 'INVALID_TOKEN' });
    }

    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Malformed authentication token.' });
    }

    // 3. Find User
    const user = await User.findById(userId).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Account not found or has been deactivated.' });
    }

    // 4. Verify Session status if sessionId is present in token payload
    if (decoded.sessionId) {
      const sessionDoc = await Session.findOne({
        sessionId: decoded.sessionId,
        userId: user._id,
      });

      if (!sessionDoc || sessionDoc.revokedAt) {
        return res.status(401).json({ message: 'This session has been signed out or revoked.', code: 'SESSION_REVOKED' });
      }

      if (new Date() > sessionDoc.expiresAt) {
        return res.status(401).json({ message: 'Session expired. Please sign in again.', code: 'SESSION_EXPIRED' });
      }

      // Periodically update lastActiveAt (throttle to at most once every 5 minutes to avoid DB churn)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (!sessionDoc.lastActiveAt || sessionDoc.lastActiveAt.getTime() < fiveMinutesAgo) {
        sessionDoc.lastActiveAt = new Date();
        await sessionDoc.save().catch(() => {});
      }

      req.sessionId = decoded.sessionId;
      req.sessionDoc = sessionDoc;
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, authentication failed' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Role '${req.user?.role || 'unknown'}' is not authorized.` });
    }
    next();
  };
};
