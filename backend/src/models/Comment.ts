import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  issue?: mongoose.Types.ObjectId;
  mentions: mongoose.Types.ObjectId[];
  attachments: Array<{ name: string; url: string }>;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    issue: { type: Schema.Types.ObjectId, ref: 'Issue' },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    attachments: [{ name: String, url: String }],
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IComment>('Comment', commentSchema);
