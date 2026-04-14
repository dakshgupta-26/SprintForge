import mongoose, { Document, Schema } from 'mongoose';

export interface IProject extends Document {
  name: string;
  key: string;
  description?: string;
  icon?: string;
  color: string;
  owner: mongoose.Types.ObjectId;
  joinCode?: string;
  joinCodeEnabled: boolean;
  members: Array<{
    user: mongoose.Types.ObjectId;
    role: string;
    permissions: Array<'view' | 'create' | 'edit' | 'delete' | 'manage'>;
    joinedAt: Date;
  }>;
  isPrivate: boolean;
  type: 'scrum' | 'kanban';
  status: 'active' | 'archived' | 'completed';
  startDate?: Date;
  endDate?: Date;
  sprints: mongoose.Types.ObjectId[];
  boards: mongoose.Types.ObjectId[];
  tags: string[];
  githubRepo?: string;
  slackWebhook?: string;
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, uppercase: true, trim: true, maxlength: 6 },
    description: { type: String },
    icon: { type: String },
    color: { type: String, default: '#6366f1' },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    joinCode: { type: String, unique: true, sparse: true },
    joinCodeEnabled: { type: Boolean, default: false },
    members: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, default: 'member' },
        permissions: [{ type: String, enum: ['view', 'create', 'edit', 'delete', 'manage'] }],
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    isPrivate: { type: Boolean, default: false },
    type: { type: String, enum: ['scrum', 'kanban'], default: 'scrum' },
    status: { type: String, enum: ['active', 'archived', 'completed'], default: 'active' },
    startDate: { type: Date },
    endDate: { type: Date },
    sprints: [{ type: Schema.Types.ObjectId, ref: 'Sprint' }],
    boards: [{ type: Schema.Types.ObjectId, ref: 'Board' }],
    tags: [{ type: String }],
    githubRepo: { type: String },
    slackWebhook: { type: String },
  },
  { timestamps: true }
);

projectSchema.index({ owner: 1 });
projectSchema.index({ 'members.user': 1 });

export default mongoose.model<IProject>('Project', projectSchema);
