import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';

let profileImagesBucket: GridFSBucket | null = null;
let chatAttachmentsBucket: GridFSBucket | null = null;

export const getProfileImagesBucket = (): GridFSBucket => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB database connection is not available');
  }
  if (!profileImagesBucket) {
    profileImagesBucket = new GridFSBucket(db, {
      bucketName: 'profileImages',
    });
  }
  return profileImagesBucket;
};

export const getChatAttachmentsBucket = (): GridFSBucket => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB database connection is not available');
  }
  if (!chatAttachmentsBucket) {
    chatAttachmentsBucket = new GridFSBucket(db, {
      bucketName: 'chatAttachments',
    });
  }
  return chatAttachmentsBucket;
};

export const uploadBufferToGridFS = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<ObjectId> => {
  const bucket = getProfileImagesBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { contentType, uploadedAt: new Date() },
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    readable
      .pipe(uploadStream)
      .on('error', (err) => reject(err))
      .on('finish', () => resolve(uploadStream.id));
  });
};

export const uploadChatAttachmentToGridFS = async (
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata?: Record<string, any>
): Promise<ObjectId> => {
  const bucket = getChatAttachmentsBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        contentType,
        uploadedAt: new Date(),
        ...metadata,
      },
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    readable
      .pipe(uploadStream)
      .on('error', (err) => reject(err))
      .on('finish', () => resolve(uploadStream.id));
  });
};

export const deleteGridFSFile = async (fileId: string | ObjectId, bucketName = 'profileImages'): Promise<void> => {
  try {
    const bucket = bucketName === 'chatAttachments' ? getChatAttachmentsBucket() : getProfileImagesBucket();
    const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
    await bucket.delete(id);
  } catch (err) {
    console.warn(`Could not delete GridFS file ${fileId} from ${bucketName}:`, err);
  }
};

