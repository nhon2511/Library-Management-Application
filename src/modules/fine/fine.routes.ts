import { Router } from 'express';
import { fineController } from './fine.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  settleFineSchema,
  waiveFineSchema,
  fineIdParamSchema,
  findFinesQuerySchema,
} from './fine.schema';

const router = Router();

router.get('/', authenticate, validate(findFinesQuerySchema, 'query'), fineController.findAll);
router.patch(
  '/:id/settle',
  authenticate,
  authorize('LIBRARIAN', 'ADMIN'),
  validate(fineIdParamSchema, 'params'),
  validate(settleFineSchema),
  fineController.settle,
);
router.patch(
  '/:id/waive',
  authenticate,
  authorize('ADMIN'),
  validate(fineIdParamSchema, 'params'),
  validate(waiveFineSchema),
  fineController.waive,
);

export default router;
