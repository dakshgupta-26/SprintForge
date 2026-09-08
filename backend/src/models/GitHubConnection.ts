import mongoose, { Document, Schema } from 'mongoose';

export interface IGitHubConnection extends Document {
  user: mongoose.Types.ObjectId;
  githubUserId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl?: string;
  encryptedAccessToken: string; // AES-256-CBC encrypted token
  iv: string; // Initialization vector
  scopes: string[];
  connectedAt: Date;
  updatedAt: Date;
}

const gitHubConnectionSchema = new Schema<IGitHubConnection>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    githubUserId: { type: String, required: true },
    username: { type: String, required: true },
    displayName: { type: String },
    avatarUrl: { type: String },
    profileUrl: { type: String },
    encryptedAccessToken: { type: String, required: true },
    iv: { type: String, required: true },
    scopes: [{ type: String }],
    connectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

gitHubConnectionSchema.index({ user: 1 });
gitHubConnectionSchema.index({ githubUserId: 1 });

export default mongoose.model<IGitHubConnection>('GitHubConnection', gitHubConnectionSchema);
