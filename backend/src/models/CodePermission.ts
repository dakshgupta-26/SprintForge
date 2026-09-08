import mongoose, { Document, Schema } from 'mongoose';

export type CodePermissionLevel = 'VIEW' | 'EDIT' | 'WRITE';

export interface ICodePermission extends Document {
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  permission: CodePermissionLevel;
  grantedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const codePermissionSchema = new Schema<ICodePermission>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    permission: {
      type: String,
      enum: ['VIEW', 'EDIT', 'WRITE'],
      default: 'EDIT',
      required: true,
    },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

codePermissionSchema.index({ project: 1, user: 1 }, { unique: true });

export default mongoose.model<ICodePermission>('CodePermission', codePermissionSchema);
