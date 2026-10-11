import { Request, Response } from 'express';
import { fineService } from './fine.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

export class FineController {
  findAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { userId, status, page, limit } = req.query;
    const targetUserId = req.user!.role === 'READER' ? req.user!.id : (userId as string);

    const result = await fineService.findAll({
      userId: targetUserId,
      status: status as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    ApiResponse.success(res, result.fines, 'Thành công', 200, result.pagination);
  });

  settle = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const fine = await fineService.settle(req.params.id as string, req.body.paymentMethod);
    ApiResponse.success(res, fine, 'Xác nhận thu tiền thành công');
  });

  waive = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const fine = await fineService.waive(req.params.id as string, req.user!.id, req.body.reason);
    ApiResponse.success(res, fine, 'Miễn giảm khoản phạt thành công');
  });
}

export const fineController = new FineController();
