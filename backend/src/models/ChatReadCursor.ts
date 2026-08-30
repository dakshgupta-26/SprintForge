import mongoose, { Document, Schema } from 'mongoose';

export interface IChatReadCursor extends Document {
  user: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  lastReadMessageId?: mongoose.Types.ObjectId;
  lastReadAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatReadCursorSchema = new Schema<IChatReadCursor>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    lastReadMessageId: { type: Schema.Types.ObjectId, ref: 'Message' },
    lastReadAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index for ultra-fast O(1) user+project read cursor lookup
chatReadCursorSchema.index({ user: 1, project: 1 }, { unique: true });

export default mongoose.model<IChatReadCursor>('ChatReadCursor', chatReadCursorSchema);
