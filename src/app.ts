import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config';
import prisma from './config/database';
import { globalRateLimiter } from './middlewares/rate-limit.middleware';
import { errorHandler } from './middlewares/error-handler.middleware';
import { NotFoundError } from './utils/api-error';
import { ApiResponse } from './utils/api-response';

// Import Routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import categoryRoutes from './modules/category/category.routes';
import bookRoutes from './modules/book/book.routes';
import bookCopyRoutes from './modules/book-copy/book-copy.routes';
import borrowRoutes from './modules/borrow/borrow.routes';
import fineRoutes from './modules/fine/fine.routes';
import reportRoutes from './modules/report/report.routes';
import auditLogRoutes from './modules/audit-log/audit-log.routes';

const app: Application = appExpress();

function appExpress(): Application {
  return express();
}

// Security & Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (config.isDev) {
  app.use(morgan('dev'));
}

// Global Rate Limiter
app.use('/api/', globalRateLimiter);

// Health Check Endpoint
app.get('/healthz', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    ApiResponse.success(res, { status: 'healthy', database: 'connected' }, 'Hệ thống hoạt động bình thường');
  } catch (error) {
    ApiResponse.error(res, 'Lỗi kết nối cơ sở dữ liệu', 500, error);
  }
});

// API Routes
app.get('/api/v1', (_req: Request, res: Response) => {
  ApiResponse.success(res, { version: '1.0.0' }, 'Library Management System API v1');
});
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/books', bookRoutes);
app.use('/api/v1', bookCopyRoutes);
app.use('/api/v1/borrows', borrowRoutes);
app.use('/api/v1/fines', fineRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);

// 404 Handler
app.use((_req: Request, _res: Response, next) => {
  next(new NotFoundError('Đường dẫn API không tồn tại'));
});

// Error Handler
app.use(errorHandler);

export default app;
