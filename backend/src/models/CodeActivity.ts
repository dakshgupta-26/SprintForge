import mongoose, { Document, Schema } from 'mongoose';

export type CodeActionType =
  | 'created'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'committed'
  | 'pushed'
  | 'pulled'
  | 'branch_created'
  | 'branch_switched';

export interface ICodeActivity extends Document {
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  file?: string;
  action: CodeActionType;
  details?: string;
  metadata?: {
    commitHash?: string;
    branch?: string;
    oldPath?: string;
    newPath?: string;
    linesAdded?: number;
    linesDeleted?: number;
    diffSnippet?: string;
  };
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const codeActivitySchema = new Schema<ICodeActivity>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    file: { type: String },
    action: {
      type: String,
      enum: [
        'created',
        'modified',
        'deleted',
        'renamed',
        'committed',
        'pushed',
        'pulled',
        'branch_created',
        'branch_switched',
      ],
      required: true,
    },
    details: { type: String },
    metadata: {
      commitHash: { type: String },
      branch: { type: String },
      oldPath: { type: String },
      newPath: { type: String },
      linesAdded: { type: Number },
      linesDeleted: { type: Number },
      diffSnippet: { type: String },
    },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

codeActivitySchema.index({ project: 1, timestamp: -1 });
codeActivitySchema.index({ project: 1, user: 1 });
codeActivitySchema.index({ project: 1, file: 1 });

export default mongoose.model<ICodeActivity>('CodeActivity', codeActivitySchema);
