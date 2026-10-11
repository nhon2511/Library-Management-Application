import { Request, Response } from 'express';
import { reportService } from './report.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

export class ReportController {
  getOverview = asyncHandler(async (_req: Request, res: Response) => {
    const overview = await reportService.getOverview();
    ApiResponse.success(res, overview);
  });
}

export const reportController = new ReportController();
