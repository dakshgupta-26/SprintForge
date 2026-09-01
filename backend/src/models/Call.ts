import mongoose, { Document, Schema } from 'mongoose';

export type CallType = 'audio' | 'video';
export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'accepted'
  | 'connected'
  | 'rejected'
  | 'missed'
  | 'cancelled'
  | 'failed'
  | 'completed';

export interface ICall extends Document {
  caller: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  type: CallType;
  status: CallStatus;
  startedAt: Date;
  connectedAt?: Date;
  endedAt?: Date;
  duration: number; // in seconds
  isRead: boolean; // whether missed call was seen by receiver
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const callSchema = new Schema<ICall>(
  {
    caller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    type: { type: String, enum: ['audio', 'video'], default: 'video', required: true },
    status: {
      type: String,
      enum: [
        'initiated',
        'ringing',
        'accepted',
        'connected',
        'rejected',
        'missed',
        'cancelled',
        'failed',
        'completed',
      ],
      default: 'initiated',
      required: true,
    },
    startedAt: { type: Date, default: Date.now },
    connectedAt: { type: Date },
    endedAt: { type: Date },
    duration: { type: Number, default: 0 },
    isRead: { type: Boolean, default: false },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

callSchema.index({ project: 1, createdAt: -1 });
callSchema.index({ receiver: 1, isRead: 1 });
callSchema.index({ caller: 1, createdAt: -1 });
callSchema.index({ status: 1 });

export default mongoose.model<ICall>('Call', callSchema);
