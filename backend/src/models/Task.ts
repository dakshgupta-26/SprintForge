import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  type: 'story' | 'task' | 'bug' | 'epic' | 'subtask';
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  project: mongoose.Types.ObjectId;
  sprint?: mongoose.Types.ObjectId;
  assignees: mongoose.Types.ObjectId[];
  reporter: mongoose.Types.ObjectId;
  parent?: mongoose.Types.ObjectId;
  subtasks: mongoose.Types.ObjectId[];
  labels: string[];
  storyPoints?: number;
  estimatedHours?: number;
  loggedHours?: number;
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  attachments: Array<{ name: string; url: string; size: number; uploadedBy: mongoose.Types.ObjectId; uploadedAt: Date }>;
  comments: mongoose.Types.ObjectId[];
  linkedIssues: mongoose.Types.ObjectId[];
  githubPRs: string[];
  boardColumn?: string;
  boardOrder: number;
  aiEstimate?: number;
  watchers: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    type: { type: String, enum: ['story', 'task', 'bug', 'epic', 'subtask'], default: 'task' },
    status: { type: String, default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    sprint: { type: Schema.Types.ObjectId, ref: 'Sprint' },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Task' },
    subtasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    labels: [{ type: String }],
    storyPoints: { type: Number, min: 0, max: 100 },
    estimatedHours: { type: Number },
    loggedHours: { type: Number, default: 0 },
    dueDate: { type: Date },
    startDate: { type: Date },
    completedAt: { type: Date },
    attachments: [
      {
        name: String,
        url: String,
        size: Number,
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    linkedIssues: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    githubPRs: [{ type: String }],
    boardColumn: { type: String },
    boardOrder: { type: Number, default: 0 },
    aiEstimate: { type: Number },
    watchers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

taskSchema.index({ project: 1 });
taskSchema.index({ sprint: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ status: 1 });

export default mongoose.model<ITask>('Task', taskSchema);
