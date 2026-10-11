import { Router } from 'express';
import { bookCopyController } from './book-copy.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { addCopiesSchema, updateCopySchema } from './book-copy.schema';

const router = Router();

// Librarian/Admin
router.post(
  '/books/:bookId/copies',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(addCopiesSchema),
  bookCopyController.addCopies,
);

router.get(
  '/books/:bookId/copies',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  bookCopyController.findByBook,
);

router.get(
  '/copies/barcode/:barcode',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  bookCopyController.findByBarcode,
);

router.patch(
  '/copies/:id',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(updateCopySchema),
  bookCopyController.update,
);

export default router;
