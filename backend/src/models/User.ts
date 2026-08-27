import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IProfileImage {
  fileId: mongoose.Types.ObjectId;
  filename: string;
  contentType: string;
  uploadedAt: Date;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  profileImage?: IProfileImage;
  role: 'admin' | 'member' | 'viewer';
  provider: 'local' | 'google' | 'github';
  providerId?: string;
  bio?: string;
  title?: string;
  location?: string;
  website?: string;
  timezone?: string;
  language?: string;
  projects: mongoose.Types.ObjectId[];
  notifications: mongoose.Types.ObjectId[];
  isActive: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    avatar:   { type: String },
    profileImage: {
      fileId: { type: Schema.Types.ObjectId },
      filename: { type: String },
      contentType: { type: String },
      uploadedAt: { type: Date, default: Date.now },
    },
    role:     { type: String, enum: ['admin', 'member', 'viewer'], default: 'member' },
    provider: { type: String, enum: ['local', 'google', 'github'], default: 'local' },
    providerId: { type: String },
    bio:      { type: String, maxlength: 500 },
    title:    { type: String },
    location: { type: String },
    website:  { type: String },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'English (US)' },
    projects:      [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    notifications: [{ type: Schema.Types.ObjectId, ref: 'Notification' }],
    isActive: { type: Boolean, default: true },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Pre-save hook: hash password before saving
userSchema.pre('save', async function (this: any) {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password as string, 12);
});

// Instance method: compare plain password against stored hash
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
