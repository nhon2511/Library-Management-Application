import { Router } from 'express';
import { borrowController } from './borrow.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  lookupByBarcodeSchema,
  reserveSchema,
  checkoutSchema,
  returnSchema,
  borrowIdParamSchema,
  myBorrowsQuerySchema,
} from './borrow.schema';

const router = Router();

// Lookup — static route before /:id
router.get(
  '/lookup',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(lookupByBarcodeSchema, 'query'),
  borrowController.lookupByBarcode,
);

// Reader
router.post(
  '/reserve',
  authenticate,
  authorize('READER'),
  validate(reserveSchema),
  borrowController.reserve,
);
router.post(
  '/:id/renew',
  authenticate,
  authorize('READER'),
  validate(borrowIdParamSchema, 'params'),
  borrowController.renew,
);
router.get(
  '/my',
  authenticate,
  authorize('READER'),
  validate(myBorrowsQuerySchema, 'query'),
  borrowController.getMyBorrows,
);

// Librarian/Admin
router.post(
  '/checkout',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(checkoutSchema),
  borrowController.checkout,
);
router.post(
  '/:id/return',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(borrowIdParamSchema, 'params'),
  validate(returnSchema),
  borrowController.returnBooks,
);

export default router;
