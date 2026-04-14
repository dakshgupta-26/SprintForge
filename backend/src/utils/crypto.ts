import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Use ENCRYPTION_KEY from environment, or fallback to a hardcoded 32-byte key for development.
// In production, MUST use a secure random 32-byte string!
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const IV_LENGTH = 16;

export const encryptMessage = (text: string) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
  };
};

export const decryptMessage = (encryptedData: string, ivHex: string) => {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '***[Encrypted Message]***';
  }
};
