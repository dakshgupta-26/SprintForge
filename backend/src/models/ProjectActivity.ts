import mongoose, { Document, Schema } from 'mongoose';

export type ProjectActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_IMAGE_UPDATED'
  | 'PROJECT_IMAGE_REMOVED'
  | 'MEMBER_INVITED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'OWNERSHIP_TRANSFERRED'
  | 'PROJECT_SETTINGS_UPDATED'
  | 'PROJECT_DELETED';

export interface IProjectActivity extends Document {
  project: mongoose.Types.ObjectId;
  actor: mongoose.Types.ObjectId;
  action: ProjectActivityAction;
  details: string;
  target?: {
    id?: mongoose.Types.ObjectId;
    type?: string;
    name?: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
}

const projectActivitySchema = new Schema<IProjectActivity>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: {
      type: String,
      required: true,
      index: true,
    },
    details: { type: String, required: true },
    target: {
      id: { type: Schema.Types.ObjectId },
      type: { type: String },
      name: { type: String },
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

projectActivitySchema.index({ project: 1, createdAt: -1 });

export default mongoose.model<IProjectActivity>('ProjectActivity', projectActivitySchema);
