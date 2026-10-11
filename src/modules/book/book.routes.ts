import { Router } from 'express';
import { bookController } from './book.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createBookSchema, updateBookSchema } from './book.schema';

const router = Router();

// Public
router.get('/', bookController.findAll);
router.get('/:id', bookController.findById);

// Librarian/Admin
router.post(
  '/',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(createBookSchema),
  bookController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(updateBookSchema),
  bookController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  bookController.delete,
);

export default router;
