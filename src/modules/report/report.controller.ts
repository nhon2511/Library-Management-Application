import { Request, Response } from 'express';
import { reportService } from './report.service';
import { ApiResponse } from '../../utils/api-response';
import { asyncHandler } from '../../utils/async-handler';

export class ReportController {
  getOverview = asyncHandler(async (_req: Request, res: Response) => {
    const overview = await reportService.getOverview();
    ApiResponse.success(res, overview);
  });

  getTopBooks = asyncHandler(async (_req: Request, res: Response) => {
    const topBooks = await reportService.getTopBooks();
    ApiResponse.success(res, topBooks);
  });

  getMonthlyTrends = asyncHandler(async (_req: Request, res: Response) => {
    const trends = await reportService.getMonthlyTrends();
    ApiResponse.success(res, trends);
  });

  getCategoriesRatio = asyncHandler(async (_req: Request, res: Response) => {
    const ratio = await reportService.getCategoriesRatio();
    ApiResponse.success(res, ratio);
  });

  exportExcel = asyncHandler(async (_req: Request, res: Response) => {
    await reportService.exportExcel(res);
  });
}

export const reportController = new ReportController();
