import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import prisma from '../../config/database';
import { config } from '../../config';
import { RegisterInput, LoginInput } from './auth.schema';
import { BadRequestError, ConflictError, UnauthorizedError } from '../../utils/api-error';
import { JwtPayload } from '../../types';

export class AuthService {
  private hashTokenId(tokenId: string): string {
    return createHash('sha256').update(tokenId).digest('hex');
  }

  private refreshExpiry(token: string): Date {
    const payload = jwt.decode(token) as { exp?: number } | null;
    if (!payload?.exp) throw new Error('Refresh token missing expiry');
    return new Date(payload.exp * 1000);
  }

  private createQrCode(role: string): string {
    return `${role}-${randomUUID()}`;
  }

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
        qrCode: this.createQrCode('READER'),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        qrCode: true,
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

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    if (user.status !== 'ACTIVE') {
      throw new BadRequestError('Tài khoản đã bị vô hiệu hóa');
    }

    if (!user.qrCode) {
      user.qrCode = this.createQrCode(user.role);
      await prisma.user.update({
        where: { id: user.id },
        data: { qrCode: user.qrCode },
      });
    }

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
    });

    const refreshTokenId = randomUUID();
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
      jwtid: refreshTokenId,
    });
    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: this.hashTokenId(refreshTokenId),
        expiresAt: this.refreshExpiry(refreshToken),
      },
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
        qrCode: user.qrCode,
      },
    };
  }

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload & { jti?: string };
      if (!decoded.jti) throw new UnauthorizedError('Refresh token không hợp lệ');
      const tokenId = decoded.jti;

      return await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: decoded.id } });
        if (!user || user.status !== 'ACTIVE' || user.tokenVersion !== decoded.tokenVersion) {
          throw new UnauthorizedError('Refresh token không hợp lệ');
        }

        const consumed = await tx.refreshSession.updateMany({
          where: {
            userId: user.id,
            tokenHash: this.hashTokenId(tokenId),
            revokedAt: null,
            expiresAt: { gt: new Date() },
          },
          data: { revokedAt: new Date() },
        });
        if (consumed.count !== 1) throw new UnauthorizedError('Refresh token đã được sử dụng');

        const payload: JwtPayload = {
          id: user.id,
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion,
        };
        const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
          expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
        });
        const nextTokenId = randomUUID();
        const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
          expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
          jwtid: nextTokenId,
        });
        await tx.refreshSession.create({
          data: {
            userId: user.id,
            tokenHash: this.hashTokenId(nextTokenId),
            expiresAt: this.refreshExpiry(refreshToken),
          },
        });
        return { accessToken, refreshToken };
      });
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn');
      }
      throw error;
    }
  }

  async logout(userId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } });
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
  }
}

export const authService = new AuthService();
