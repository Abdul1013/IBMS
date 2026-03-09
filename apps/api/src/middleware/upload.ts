import multer from 'multer';
import type { Request } from 'express';
import { cloudinary } from '../config/cloudinary';
import { AppError } from '../utils/AppError';

// ─── Multer (memory storage) ──────────────────────────────────────────────────
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req: Request, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('File type not allowed', 400, 'INVALID_FILE_TYPE'));
    }
  },
});

// ─── Cloudinary upload helper ─────────────────────────────────────────────────
export interface UploadResult {
  url: string;
  publicId: string;
  resourceType: string;
  bytes: number;
}

export const uploadToCloudinary = (
  buffer: Buffer,
  mimetype: string,
  folder = 'ibms/attachments'
): Promise<UploadResult> =>
  new Promise((resolve, reject) => {
    const resourceType = mimetype === 'application/pdf' ? 'raw' : 'image';

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('File upload failed', 500, 'UPLOAD_ERROR'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          bytes: result.bytes,
        });
      }
    );

    stream.end(buffer);
  });
