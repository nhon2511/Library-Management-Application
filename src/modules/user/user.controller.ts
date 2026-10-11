import { Request, Response } from 'express';
import { userService } from './user.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { Role, UserStatus } from '@prisma/client';

export class UserController {
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
