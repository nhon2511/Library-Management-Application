import { Router } from 'express';
import { reportController } from './report.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { reportQuerySchema } from './report.schema';

const router = Router();

// Static routes — /export/excel before any potential param routes
router.get(
  '/export/excel',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(reportQuerySchema, 'query'),
  reportController.exportExcel,
);

router.get(
  '/overview',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(reportQuerySchema, 'query'),
  reportController.getOverview,
);
router.get(
  '/top-books',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(reportQuerySchema, 'query'),
  reportController.getTopBooks,
);
router.get(
  '/monthly-trends',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(reportQuerySchema, 'query'),
  reportController.getMonthlyTrends,
);
router.get(
  '/categories-ratio',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(reportQuerySchema, 'query'),
  reportController.getCategoriesRatio,
);

export default router;
