import { Router } from 'express';
import { bookController } from './book.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  createBookSchema,
  updateBookSchema,
  bookIdParamSchema,
  searchBookSchema,
} from './book.schema';
import { uploadBookCover } from '../../middlewares/upload.middleware';

const router = Router();

// Public
router.get('/', validate(searchBookSchema, 'query'), bookController.findAll);
router.get('/:id', validate(bookIdParamSchema, 'params'), bookController.findById);

// Librarian/Admin
router.post(
  '/',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  uploadBookCover,
  validate(createBookSchema),
  bookController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  uploadBookCover,
  validate(bookIdParamSchema, 'params'),
  validate(updateBookSchema),
  bookController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(bookIdParamSchema, 'params'),
  bookController.delete,
);

export default router;
