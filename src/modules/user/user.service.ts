import prisma from '../../config/database';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/api-error';
import { UpdateProfileInput } from './user.schema';
import { PAGINATION } from '../../utils/constants';
import { Prisma, Role, UserStatus } from '@prisma/client';
import QRCode from 'qrcode';
import { randomUUID } from 'node:crypto';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  status: true,
  avatarUrl: true,
  qrCode: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export class UserService {
  private async ensureQrCode(userId: string, role: Role, currentQrCode: string | null) {
    if (currentQrCode) return currentQrCode;

    const qrCode = `${role}-${randomUUID()}`;
    await prisma.user.update({ where: { id: userId }, data: { qrCode } });
    return qrCode;
  }

  async lookupByQrCode(qrCode: string) {
    const user = await prisma.user.findUnique({
      where: { qrCode },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        qrCode: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new NotFoundError('Không tìm thấy người dùng hoặc tài khoản không hoạt động');
    }

    return user;
  }

  async getQrCodeImage(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, qrCode: true },
    });

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }
    const qrCode = await this.ensureQrCode(userId, user.role, user.qrCode);

    const dataUrl = await QRCode.toDataURL(qrCode, { width: 300, margin: 2 });
    return dataUrl;
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    if (!user.qrCode) {
      user.qrCode = await this.ensureQrCode(user.id, user.role, user.qrCode);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: userSelect,
    });

    return user;
  }

  async updateStatus(userId: string, status: UserStatus, actorId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }
    if (actorId === userId && status !== 'ACTIVE') {
      throw new BadRequestError('Không thể tự khóa tài khoản quản trị');
    }
    if (user.role === 'ADMIN' && status !== 'ACTIVE') {
      const activeAdmins = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      if (activeAdmins <= 1) throw new ConflictError('Không thể khóa quản trị viên cuối cùng');
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { status },
        select: userSelect,
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'UPDATE_USER_STATUS',
          entity: 'User',
          entityId: userId,
          details: { oldStatus: user.status, newStatus: status },
        },
      });
      return updated;
    });
  }

  async searchUsers(params: {
    search?: string;
    role?: Role;
    status?: UserStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(params.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (params.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.role) where.role = params.role;
    if (params.status) where.status = params.status;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const userService = new UserService();
