import mongoose, { Document, Schema } from 'mongoose';

export interface ISprint extends Document {
  name: string;
  goal?: string;
  project: mongoose.Types.ObjectId;
  status: 'planning' | 'active' | 'completed';
  startDate: Date;
  endDate: Date;
  tasks: mongoose.Types.ObjectId[];
  velocity?: number;
  completedPoints?: number;
  totalPoints?: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const sprintSchema = new Schema<ISprint>(
  {
    name: { type: String, required: true, trim: true },
    goal: { type: String },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    status: { type: String, enum: ['planning', 'active', 'completed'], default: 'planning' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    tasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
    velocity: { type: Number },
    completedPoints: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

sprintSchema.index({ project: 1 });
sprintSchema.index({ status: 1 });

export default mongoose.model<ISprint>('Sprint', sprintSchema);
