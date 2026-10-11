import { Request, Response } from 'express';
import { borrowService } from './borrow.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

export class BorrowController {
  reserve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await borrowService.reserve(req.user!.id, req.body);
    ApiResponse.created(res, record, 'Đặt mượn thành công');
  });

  checkout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await borrowService.checkout(req.user!.id, req.body);
    ApiResponse.created(res, record, 'Checkout thành công');
  });

  returnBooks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await borrowService.returnBooks(req.params.id as string, req.user!.id, req.body);
    ApiResponse.success(res, record, 'Trả sách thành công');
  });

  renew = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const record = await borrowService.renew(req.params.id as string, req.user!.id);
    ApiResponse.success(res, record, 'Gia hạn thành công');
  });

  getMyBorrows = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status, page, limit } = req.query;
    const result = await borrowService.getMyBorrows(req.user!.id, {
      status: status as string,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    ApiResponse.success(res, result.records, 'Thành công', 200, result.pagination);
  });
}

export const borrowController = new BorrowController();
