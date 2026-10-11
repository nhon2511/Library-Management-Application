import { Router } from 'express';
import { borrowController } from './borrow.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { reserveSchema, checkoutSchema, returnSchema } from './borrow.schema';

const router = Router();

// Reader
router.post('/reserve', authenticate, authorize('READER'), validate(reserveSchema), borrowController.reserve);
router.post('/:id/renew', authenticate, authorize('READER'), borrowController.renew);
router.get('/my', authenticate, authorize('READER'), borrowController.getMyBorrows);

// Librarian/Admin
router.post('/checkout', authenticate, authorize('LIBRARIAN', 'ADMIN'), validate(checkoutSchema), borrowController.checkout);
router.post('/:id/return', authenticate, authorize('LIBRARIAN', 'ADMIN'), validate(returnSchema), borrowController.returnBooks);

export default router;
