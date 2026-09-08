import mongoose, { Document, Schema } from 'mongoose';

export interface ICodeDocumentVersion extends Document {
  project: mongoose.Types.ObjectId;
  file: string;
  versionNumber: number;
  user: mongoose.Types.ObjectId;
  content: string;
  summary?: string;
  createdAt: Date;
}

const codeDocumentVersionSchema = new Schema<ICodeDocumentVersion>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    file: { type: String, required: true },
    versionNumber: { type: Number, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    summary: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

codeDocumentVersionSchema.index({ project: 1, file: 1, versionNumber: -1 });

export default mongoose.model<ICodeDocumentVersion>(
  'CodeDocumentVersion',
  codeDocumentVersionSchema
);
