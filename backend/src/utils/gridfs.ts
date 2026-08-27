import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import { Readable } from 'stream';

let gridfsBucket: GridFSBucket | null = null;

export const getProfileImagesBucket = (): GridFSBucket => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB database connection is not available');
  }
  if (!gridfsBucket) {
    gridfsBucket = new GridFSBucket(db, {
      bucketName: 'profileImages',
    });
  }
  return gridfsBucket;
};

export const uploadBufferToGridFS = async (
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<ObjectId> => {
  const bucket = getProfileImagesBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType,
      metadata: { uploadedAt: new Date() },
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

export const deleteGridFSFile = async (fileId: string | ObjectId): Promise<void> => {
  try {
    const bucket = getProfileImagesBucket();
    const id = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
    await bucket.delete(id);
  } catch (err) {
    console.warn(`Could not delete GridFS file ${fileId}:`, err);
  }
};
