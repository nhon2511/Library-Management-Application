import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error('Request failed', {
    name: err.name,
    statusCode: err instanceof ApiError ? err.statusCode : 500,
  });

  if (res.headersSent) {
    res.destroy();
    return;
  }

  if (err instanceof ApiError) {
    const responseBody: Record<string, unknown> = {
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    };
    if (err.errors !== undefined) {
      responseBody.errors = err.errors;
    }
    res.status(err.statusCode).json(responseBody);
    return;
  }

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: 'Lỗi hệ thống, vui lòng thử lại sau',
  });
};
