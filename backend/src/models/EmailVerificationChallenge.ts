import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailVerificationChallenge extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  otpHash: string;
  purpose: string;
  expiresAt: Date;
  attempts: number;
  lastSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailVerificationChallengeSchema = new Schema<IEmailVerificationChallenge>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    otpHash: { type: String, required: true },
    purpose: { type: String, default: 'FIRST_LOGIN_EMAIL_VERIFICATION' },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL Index: automatically removes expired documents
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IEmailVerificationChallenge>(
  'EmailVerificationChallenge',
  emailVerificationChallengeSchema
);
