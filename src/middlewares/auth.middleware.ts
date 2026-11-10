import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError } from '../utils/api-error';
import { JwtPayload } from '../types';
import prisma from '../config/database';

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
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
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, status: true, tokenVersion: true },
    });
    if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== decoded.tokenVersion) {
      throw new UnauthorizedError('Phiên đăng nhập không hợp lệ');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
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
