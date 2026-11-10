import { NextFunction, Request, RequestHandler, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'node:stream';
import { ApiError, BadRequestError } from '../utils/api-error';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    callback(new BadRequestError('Ảnh bìa phải có định dạng jpeg, png hoặc webp'));
    return;
  }
  callback(null, true);
};

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

export function matchesImageSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  if (file.mimetype === 'image/jpeg')
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.mimetype === 'image/png')
    return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return (
    file.mimetype === 'image/webp' &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP'
  );
}

export const uploadBookCover: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (!hasCloudinaryConfig && req.headers['content-type']?.includes('multipart/form-data')) {
    next(new BadRequestError('Chưa cấu hình Cloudinary để tải ảnh bìa sách lên'));
    return;
  }
  upload.single('coverImage')(req, res, async (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new BadRequestError('Ảnh bìa không được vượt quá 5MB'));
      return;
    }
    if (error) {
      next(error);
      return;
    }
    if (!req.file) {
      next();
      return;
    }
    if (!matchesImageSignature(req.file)) {
      next(new BadRequestError('Nội dung file không khớp định dạng ảnh khai báo'));
      return;
    }
    try {
      const uploaded = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'library/books',
              resource_type: 'image',
              allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            },
            (uploadError, result) => {
              if (uploadError || !result) reject(uploadError ?? new Error('Upload failed'));
              else resolve({ secure_url: result.secure_url, public_id: result.public_id });
            },
          );
          Readable.from([req.file!.buffer]).pipe(stream);
        },
      );
      req.file.path = uploaded.secure_url;
      req.file.filename = uploaded.public_id;
      next();
    } catch {
      next(new ApiError(502, 'Không thể tải ảnh bìa lên'));
    }
  });
};

export async function removeUploadedCover(file?: Express.Multer.File): Promise<void> {
  if (hasCloudinaryConfig && file?.filename) {
    await cloudinary.uploader.destroy(file.filename, { resource_type: 'image' });
  }
}
