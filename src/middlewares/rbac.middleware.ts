import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/api-error';

/**
 * Middleware kiểm tra quyền truy cập theo role.
 * Sử dụng sau middleware authenticate.
 *
 * @example
 * router.get('/admin-only', authenticate, authorize('ADMIN'), controller);
 * router.get('/staff', authenticate, authorize('LIBRARIAN', 'ADMIN'), controller);
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Chưa xác thực'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Bạn không có quyền thực hiện thao tác này'));
    }

    next();
  };
};
