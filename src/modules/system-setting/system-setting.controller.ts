import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { systemSettingService } from './system-setting.service';
import { SettingKey } from './system-setting.schema';

export const systemSettingController = {
  findAll: asyncHandler(async (_req: Request, res: Response) => {
    ApiResponse.success(res, await systemSettingService.findAll());
  }),
  update: asyncHandler(async (req: Request, res: Response) => {
    const setting = await systemSettingService.update(
      req.params.key as SettingKey,
      req.body,
      req.user!.id,
    );
    ApiResponse.success(res, setting, 'Cập nhật cài đặt thành công');
  }),
};
