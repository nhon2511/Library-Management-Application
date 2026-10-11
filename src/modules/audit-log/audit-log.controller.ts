import { Request, Response } from 'express';
import { auditLogService } from './audit-log.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

export class AuditLogController {
  findAll = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    const result = await auditLogService.findAll({
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    ApiResponse.success(res, result.logs, 'Thành công', 200, result.pagination);
  });
}

export const auditLogController = new AuditLogController();
