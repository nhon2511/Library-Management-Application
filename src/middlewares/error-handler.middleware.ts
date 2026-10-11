import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/api-error';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  logger.error(err.message, {
    stack: config.isDev ? err.stack : undefined,
    name: err.name,
  });

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
    message: config.isDev ? err.message : 'Lỗi hệ thống, vui lòng thử lại sau',
  });
};
