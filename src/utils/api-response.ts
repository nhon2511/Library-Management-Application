import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseBody<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  pagination?: PaginationMeta;
  errors?: unknown;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Thao tác thành công',
    statusCode = 200,
    pagination?: PaginationMeta,
  ): Response {
    const body: ApiResponseBody<T> = {
      success: true,
      statusCode,
      message,
      data,
      ...(pagination && { pagination }),
    };
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, data: T, message = 'Tạo thành công'): Response {
    return ApiResponse.success(res, data, message, 201);
  }

  static noContent(res: Response, message = 'Xóa thành công'): Response {
    return res.status(204).json({
      success: true,
      statusCode: 204,
      message,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errors?: unknown,
  ): Response {
    const body: ApiResponseBody = {
      success: false,
      statusCode,
      message,
    };
    if (errors !== undefined) {
      body.errors = errors;
    }
    return res.status(statusCode).json(body);
  }
}
