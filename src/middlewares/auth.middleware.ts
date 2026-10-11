import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/api-error';
import { JwtPayload } from '../types';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token không được cung cấp');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Access token không hợp lệ');
    }

    const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token đã hết hạn'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Access token không hợp lệ'));
    } else {
      next(error);
    }
  }
};
