import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  project: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string; // The encrypted content
  iv: string; // Initialization vector for decryption
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    iv: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', messageSchema);
