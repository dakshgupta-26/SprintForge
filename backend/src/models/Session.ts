import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  sessionId: string;
  userId: mongoose.Types.ObjectId;
  refreshTokenHash: string;
  userAgent?: string;
  ipAddress?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  lastActiveAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<ISession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    refreshTokenHash: { type: String, required: true, index: true },
    userAgent: { type: String, default: 'Unknown Device' },
    ipAddress: { type: String, default: '127.0.0.1' },
    browser: { type: String, default: 'Browser' },
    os: { type: String, default: 'Desktop' },
    deviceType: { type: String, default: 'desktop' },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL Index: automatically removes expired sessions
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, revokedAt: 1 });

export default mongoose.model<ISession>('Session', sessionSchema);
