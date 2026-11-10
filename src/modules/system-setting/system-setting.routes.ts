import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { settingKeySchema, updateSettingSchema } from './system-setting.schema';
import { systemSettingController } from './system-setting.controller';

const router = Router();
router.use(authenticate, authorize('ADMIN'));
router.get('/', systemSettingController.findAll);
router.patch(
  '/:key',
  validate(settingKeySchema, 'params'),
  validate(updateSettingSchema),
  systemSettingController.update,
);
export default router;
