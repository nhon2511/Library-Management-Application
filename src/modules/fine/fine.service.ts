import prisma from '../../config/database';
import { NotFoundError, BadRequestError } from '../../utils/api-error';
import { PAGINATION } from '../../utils/constants';
import { Prisma } from '@prisma/client';

export class FineService {
  async findAll(params: { userId?: string; status?: string; page?: number; limit?: number }) {
    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(params.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params.userId) where.userId = params.userId;
    if (params.status) where.status = params.status;

    const [fines, total] = await Promise.all([
      prisma.fine.findMany({
        where,
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.fine.count({ where }),
    ]);

    return {
      fines,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async settle(id: string, paymentMethod: string) {
    const fine = await prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundError('Không tìm thấy khoản phạt');
    if (fine.status === 'PAID') throw new BadRequestError('Khoản phạt đã được thanh toán');
    if (fine.status === 'WAIVED') throw new BadRequestError('Khoản phạt đã được miễn giảm');

    return prisma.fine.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAmount: fine.amount,
        paidAt: new Date(),
        paymentMethod,
      },
    });
  }

  async waive(id: string, adminId: string, reason: string) {
    const fine = await prisma.fine.findUnique({ where: { id } });
    if (!fine) throw new NotFoundError('Không tìm thấy khoản phạt');
    if (fine.status === 'PAID') throw new BadRequestError('Không thể miễn giảm khoản phạt đã trả');

    return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.fine.update({
        where: { id },
        data: {
          status: 'WAIVED',
          waivedBy: adminId,
          waivedReason: reason,
          waivedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'WAIVE_FINE',
          entity: 'Fine',
          entityId: id,
          details: { reason, amount: fine.amount },
        },
      });

      return updated;
    });
  }
}

export const fineService = new FineService();
