export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown;

  constructor(statusCode: number, message: string, isOperational = true, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;
    Object.setPrototypeOf(this, ApiError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends ApiError {
  constructor(message = 'Yêu cầu không hợp lệ', errors?: unknown) {
    super(400, message, true, errors);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Chưa xác thực') {
    super(401, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Không có quyền truy cập') {
    super(403, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Không tìm thấy tài nguyên') {
    super(404, message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = 'Xung đột dữ liệu') {
    super(409, message);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(message = 'Quá nhiều yêu cầu, vui lòng thử lại sau') {
    super(429, message);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = 'Lỗi hệ thống') {
    super(500, message, false);
  }
}
