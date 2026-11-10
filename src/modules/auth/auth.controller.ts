import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';
import { config } from '../../config';
import jwt from 'jsonwebtoken';

function setRefreshCookie(res: Response, token: string): void {
  const payload = jwt.decode(token) as { exp?: number } | null;
  const maxAge = payload?.exp ? Math.max(0, payload.exp * 1000 - Date.now()) : 0;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.cookieSameSite,
    maxAge,
  });
}

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await authService.register(req.body);
    ApiResponse.created(res, user, 'Đăng ký thành công');
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await authService.login(req.body);

    setRefreshCookie(res, result.refreshToken);

    ApiResponse.success(
      res,
      { accessToken: result.accessToken, user: result.user },
      'Đăng nhập thành công',
    );
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (config.isProd && req.cookies?.refreshToken && req.headers.origin !== config.corsOrigin) {
      ApiResponse.error(res, 'Nguồn yêu cầu không hợp lệ', 403);
      return;
    }

    if (typeof token !== 'string' || token.length === 0 || token.length > 4096) {
      ApiResponse.error(res, 'Refresh token không được cung cấp', 401);
      return;
    }

    const result = await authService.refreshToken(token);

    setRefreshCookie(res, result.refreshToken);

    ApiResponse.success(res, { accessToken: result.accessToken }, 'Token đã được làm mới');
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await authService.logout(req.user!.id);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.isProd,
      sameSite: config.cookieSameSite,
    });
    ApiResponse.success(res, null, 'Đăng xuất thành công');
  });
}

export const authController = new AuthController();
