import mongoose, { Document, Schema } from 'mongoose';

export interface ICodeWorkspace extends Document {
  project: mongoose.Types.ObjectId;
  rootPath: string; // Relative directory under data/workspaces/:projectId
  repository?: {
    url: string;
    name: string;
    owner: string;
    isPrivate: boolean;
    defaultBranch: string;
    cloneUrl?: string;
    connectedBy: mongoose.Types.ObjectId;
    connectedAt: Date;
  };
  currentBranch: string;
  defaultBranch: string;
  lastSyncedAt?: Date;
  settings: {
    tabSize: number;
    fontSize: number;
    minimap: boolean;
    wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
    formatOnSave: boolean;
    theme: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const codeWorkspaceSchema = new Schema<ICodeWorkspace>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
    rootPath: { type: String, required: true },
    repository: {
      url: { type: String },
      name: { type: String },
      owner: { type: String },
      isPrivate: { type: Boolean, default: false },
      defaultBranch: { type: String, default: 'main' },
      cloneUrl: { type: String },
      connectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      connectedAt: { type: Date, default: Date.now },
    },
    currentBranch: { type: String, default: 'main' },
    defaultBranch: { type: String, default: 'main' },
    lastSyncedAt: { type: Date },
    settings: {
      tabSize: { type: Number, default: 2 },
      fontSize: { type: Number, default: 13 },
      minimap: { type: Boolean, default: true },
      wordWrap: { type: String, enum: ['on', 'off', 'wordWrapColumn', 'bounded'], default: 'on' },
      formatOnSave: { type: Boolean, default: true },
      theme: { type: String, default: 'vs-dark' },
    },
  },
  { timestamps: true }
);

codeWorkspaceSchema.index({ project: 1 });

export default mongoose.model<ICodeWorkspace>('CodeWorkspace', codeWorkspaceSchema);
