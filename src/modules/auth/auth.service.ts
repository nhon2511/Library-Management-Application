import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../../config/database';
import { config } from '../../config';
import { RegisterInput, LoginInput } from './auth.schema';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from '../../utils/api-error';
import { JwtPayload } from '../../types';

export class AuthService {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    if (user.status === 'INACTIVE') {
      throw new BadRequestError('Tài khoản đã bị vô hiệu hóa');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.status === 'INACTIVE') {
        throw new UnauthorizedError('Token không hợp lệ');
      }

      const payload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
        expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
      });

      const newRefreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
        expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
      });

      return { accessToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }
}

export const authService = new AuthService();
