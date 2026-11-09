import prisma from '../../config/database';
import { NotFoundError } from '../../utils/api-error';
import { UpdateProfileInput } from './user.schema';
import { PAGINATION } from '../../utils/constants';
import { Prisma, Role, UserStatus } from '@prisma/client';
import QRCode from 'qrcode';

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
      select: { qrCode: true },
    });

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    if (!user.qrCode) {
      throw new NotFoundError('Người dùng chưa có mã QR');
    }

    const dataUrl = await QRCode.toDataURL(user.qrCode, { width: 300, margin: 2 });
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

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: userSelect,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'UPDATE_USER_STATUS',
        entity: 'User',
        entityId: userId,
        details: { oldStatus: user.status, newStatus: status },
      },
    });

    return updated;
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
