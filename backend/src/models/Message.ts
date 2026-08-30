import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment {
  _id?: mongoose.Types.ObjectId;
  fileId: mongoose.Types.ObjectId;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
}

export interface IMessage extends Document {
  project: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string; // The encrypted content
  iv: string; // Initialization vector for decryption
  attachments: IAttachment[];
  readBy: Array<{
    user: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  reactions?: Record<string, string[]>;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    fileId: { type: Schema.Types.ObjectId, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const messageSchema = new Schema<IMessage>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    iv: { type: String, required: true },
    attachments: { type: [attachmentSchema], default: [] },
    readBy: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        readAt: { type: Date, default: Date.now },
      },
    ],
    reactions: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

messageSchema.index({ project: 1, createdAt: -1 });
messageSchema.index({ project: 1, 'readBy.user': 1, sender: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'attachments._id': 1 });

export default mongoose.model<IMessage>('Message', messageSchema);
