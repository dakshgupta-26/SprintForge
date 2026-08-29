import mongoose, { Document, Schema } from 'mongoose';

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'PASSWORD_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_COMPLETED'
  | 'EMAIL_VERIFIED'
  | 'OTP_REQUESTED'
  | 'OTP_FAILED'
  | 'SESSION_REVOKED'
  | 'REVOKE_ALL_SESSIONS'
  | 'TOKEN_REUSE_DETECTED';

export interface ISecurityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  email?: string;
  event: SecurityEventType;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  status: 'success' | 'failure' | 'warning';
  details?: string;
  createdAt: Date;
}

const securityLogSchema = new Schema<ISecurityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    event: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: { type: String, default: '127.0.0.1' },
    userAgent: { type: String, default: 'Unknown' },
    browser: { type: String, default: 'Browser' },
    os: { type: String, default: 'Desktop' },
    deviceType: { type: String, default: 'desktop' },
    status: { type: String, enum: ['success', 'failure', 'warning'], default: 'success' },
    details: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: '90d' }, // 90-day retention policy
    },
  },
  { timestamps: false }
);

securityLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<ISecurityLog>('SecurityLog', securityLogSchema);
