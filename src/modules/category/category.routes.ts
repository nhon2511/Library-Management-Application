import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createCategorySchema, updateCategorySchema } from './category.schema';

const router = Router();

// Public
router.get('/', categoryController.findAll);
router.get('/:id', categoryController.findById);

// Librarian/Admin
router.post(
  '/',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(createCategorySchema),
  categoryController.create,
);
router.patch(
  '/:id',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(updateCategorySchema),
  categoryController.update,
);
router.delete(
  '/:id',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  categoryController.delete,
);

export default router;
