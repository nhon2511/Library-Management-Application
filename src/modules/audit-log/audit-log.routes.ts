import { Router } from 'express';
import { auditLogController } from './audit-log.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { z } from 'zod';

const router = Router();

const querySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(querySchema, 'query'),
  auditLogController.findAll,
);

export default router;
