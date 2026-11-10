import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  lookupByQrCodeSchema,
  updateProfileSchema,
  updateUserStatusSchema,
  userIdParamSchema,
  searchUsersSchema,
} from './user.schema';

const router = Router();

// Static routes before /:id
router.get(
  '/lookup',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(lookupByQrCodeSchema, 'query'),
  userController.lookupByQrCode,
);

// Authenticated routes
router.get('/me', authenticate, userController.getProfile);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);

// Librarian/Admin routes
router.get(
  '/',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(searchUsersSchema, 'query'),
  userController.searchUsers,
);

// QR code image — user xem mã mình hoặc LIBRARIAN/ADMIN xem user khác
router.get(
  '/:id/qrcode',
  authenticate,
  validate(userIdParamSchema, 'params'),
  userController.getQrCodeImage,
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  validate(userIdParamSchema, 'params'),
  validate(updateUserStatusSchema),
  userController.updateStatus,
);

export default router;
