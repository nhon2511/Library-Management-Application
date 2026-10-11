import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { config } from '../../config';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await authService.register(req.body);
    ApiResponse.created(res, user, 'Đăng ký thành công');
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.login(req.body);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.success(
      res,
      { accessToken: result.accessToken, user: result.user },
      'Đăng nhập thành công',
    );
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      ApiResponse.error(res, 'Refresh token không được cung cấp', 401);
      return;
    }

    const result = await authService.refreshToken(token);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: !config.isDev,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.success(res, { accessToken: result.accessToken }, 'Token đã được làm mới');
  });

  logout = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie('refreshToken');
    ApiResponse.success(res, null, 'Đăng xuất thành công');
  });
}

export const authController = new AuthController();
