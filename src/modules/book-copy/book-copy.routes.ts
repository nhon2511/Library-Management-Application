import { Router } from 'express';
import { bookCopyController } from './book-copy.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  addCopiesSchema,
  updateCopySchema,
  copyIdParamSchema,
  bookIdParamSchema,
  barcodeParamSchema,
} from './book-copy.schema';

const router = Router();

// Librarian/Admin
router.post(
  '/books/:bookId/copies',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(bookIdParamSchema, 'params'),
  validate(addCopiesSchema),
  bookCopyController.addCopies,
);

router.get(
  '/books/:bookId/copies',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(bookIdParamSchema, 'params'),
  bookCopyController.findByBook,
);

// Static route /copies/barcode/:barcode before /copies/:id routes
router.get(
  '/copies/barcode/:barcode',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(barcodeParamSchema, 'params'),
  bookCopyController.findByBarcode,
);

// Barcode image for a specific copy
router.get(
  '/copies/:id/barcode',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(copyIdParamSchema, 'params'),
  bookCopyController.getBarcodeImage,
);

// Public API naming alias retained alongside the legacy /copies path.
router.get(
  '/book-copies/:id/barcode',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(copyIdParamSchema, 'params'),
  bookCopyController.getBarcodeImage,
);

router.patch(
  '/copies/:id',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(copyIdParamSchema, 'params'),
  validate(updateCopySchema),
  bookCopyController.update,
);

export default router;
