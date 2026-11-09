import { NextFunction, Request, RequestHandler, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { BadRequestError } from '../utils/api-error';

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

const storage = hasCloudinaryConfig
  ? new CloudinaryStorage({
      cloudinary,
      params: {
        public_id: (_req, file) =>
          `library/books/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '-')}`,
      },
    })
  : multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter,
});

export const uploadBookCover: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  upload.single('coverImage')(req, res, (error: unknown) => {
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new BadRequestError('Ảnh bìa không được vượt quá 5MB'));
      return;
    }
    next(error);
  });
};
