import { Request, Response } from 'express';
import { userService } from './user.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { Role, UserStatus } from '@prisma/client';
import { ForbiddenError } from '../../utils/api-error';

export class UserController {
  lookupByQrCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { qrCode } = req.query as { qrCode: string };
    const user = await userService.lookupByQrCode(qrCode);
    ApiResponse.success(res, user);
  });

  getQrCodeImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const targetId = req.params.id as string;
    const currentUser = req.user!;

    // User xem mã của chính mình hoặc LIBRARIAN/ADMIN xem mã user khác
    if (currentUser.id !== targetId && !['LIBRARIAN', 'ADMIN'].includes(currentUser.role)) {
      throw new ForbiddenError('Bạn không có quyền xem mã QR của người dùng khác');
    }

    const dataUrl = await userService.getQrCodeImage(targetId);
    ApiResponse.success(res, { dataUrl }, 'Lấy mã QR thành công');
  });

  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getProfile(req.user!.id);
    ApiResponse.success(res, user);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.updateProfile(req.user!.id, req.body);
    ApiResponse.success(res, user, 'Cập nhật profile thành công');
  });

  updateStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id as string;
    const { status } = req.body;
    const user = await userService.updateStatus(id, status as UserStatus, req.user!.id);
    ApiResponse.success(res, user, 'Cập nhật trạng thái thành công');
  });

  searchUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { search, role, status, page, limit } = req.query;
    const result = await userService.searchUsers({
      search: search as string,
      role: role as Role,
      status: status as UserStatus,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    ApiResponse.success(res, result.users, 'Thành công', 200, result.pagination);
  });
}

export const userController = new UserController();
