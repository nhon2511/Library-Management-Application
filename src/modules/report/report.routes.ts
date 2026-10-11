import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';

const router = Router();

router.get('/overview', authenticate, authorize('LIBRARIAN', 'ADMIN'), reportController.getOverview);

export default router;
