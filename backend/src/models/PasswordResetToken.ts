import mongoose, { Document, Schema } from 'mongoose';

export interface IPasswordResetToken extends Document {
  userId: mongoose.Types.ObjectId;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt?: Date | null;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } }, // MongoDB TTL Index: automatically removes expired tokens
    usedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPasswordResetToken>('PasswordResetToken', passwordResetTokenSchema);
