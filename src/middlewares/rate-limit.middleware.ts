import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * Global rate limiter cho tất cả API.
 */
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Quá nhiều yêu cầu, vui lòng thử lại sau',
  },
});

/**
 * Rate limiter nghiêm ngặt hơn cho auth endpoints.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Quá nhiều lần đăng nhập, vui lòng thử lại sau 15 phút',
  },
});
