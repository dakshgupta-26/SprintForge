import mongoose, { Document, Schema } from 'mongoose';

export interface IWiki extends Document {
  title: string;
  content: string;
  project: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  lastEditedBy?: mongoose.Types.ObjectId;
  slug: string;
  tags: string[];
  isPublished: boolean;
  version: number;
  parentPage?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const wikiSchema = new Schema<IWiki>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    slug: { type: String, required: true },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: true },
    version: { type: Number, default: 1 },
    parentPage: { type: Schema.Types.ObjectId, ref: 'Wiki' },
  },
  { timestamps: true }
);

wikiSchema.index({ project: 1, slug: 1 }, { unique: true });

export default mongoose.model<IWiki>('Wiki', wikiSchema);
