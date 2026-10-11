import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updateProfileSchema, updateUserStatusSchema } from './user.schema';

const router = Router();

// Authenticated routes
router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);

// Librarian/Admin routes
router.get('/', authenticate, authorize('LIBRARIAN', 'ADMIN'), userController.searchUsers);
router.patch(
  '/:id/status',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(updateUserStatusSchema),
  userController.updateStatus,
);

export default router;
