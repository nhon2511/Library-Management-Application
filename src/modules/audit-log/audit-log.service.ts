import prisma from '../../config/database';
import { PAGINATION } from '../../utils/constants';

export class AuditLogService {
  async findAll(params: { page?: number; limit?: number }) {
    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(params.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { actor: { select: { id: true, email: true, firstName: true, lastName: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const auditLogService = new AuditLogService();
