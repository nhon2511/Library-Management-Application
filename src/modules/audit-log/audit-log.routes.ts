import { Router } from 'express';
import { auditLogController } from './audit-log.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.get('/', authenticate, authorize('ADMIN'), auditLogController.findAll);

export default router;
