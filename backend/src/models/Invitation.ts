import mongoose, { Document, Schema } from 'mongoose';

export interface IInvitation extends Document {
  email: string;
  project: mongoose.Types.ObjectId;
  inviter: mongoose.Types.ObjectId;
  role: 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    inviter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
    status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Indexes
invitationSchema.index({ email: 1, project: 1 });
invitationSchema.index({ token: 1 });

export default mongoose.model<IInvitation>('Invitation', invitationSchema);
