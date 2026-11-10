import app from './app';
import { config, validateEnv } from './config';
import { logger } from './utils/logger';
import prisma from './config/database';
import { reservationCleanupJob, stopReservationCleanupJob } from './jobs/reservation-cleanup.job';
import { overdueCheckJob, stopOverdueCheckJob } from './jobs/overdue-check.job';
import { dueSoonReminderJob, stopDueSoonReminderJob } from './services/email.service';
import {
  refreshSessionCleanupJob,
  stopRefreshSessionCleanupJob,
} from './jobs/refresh-session-cleanup.job';

validateEnv();
if (config.isProd && !/^https:\/\/[^/]+$/.test(config.corsOrigin)) {
  throw new Error('CORS_ORIGIN must be an HTTPS origin without a trailing slash in production');
}

const server = app.listen(config.port, () => {
  logger.info(`Server đang chạy trên port ${config.port} ở chế độ ${config.nodeEnv}`);
  if (config.runInProcessJobs) {
    reservationCleanupJob.start();
    overdueCheckJob.start();
    dueSoonReminderJob.start();
    refreshSessionCleanupJob.start();
    logger.info('Đã khởi chạy các cron job tự động.');
  }
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Nhận tín hiệu ${signal}. Đang tắt server an toàn...`);
  stopReservationCleanupJob();
  stopOverdueCheckJob();
  stopDueSoonReminderJob();
  stopRefreshSessionCleanupJob();

  server.close(async () => {
    logger.info('HTTP server đã đóng.');
    try {
      await prisma.$disconnect();
      logger.info('Đã ngắt kết nối PostgreSQL.');
      process.exit(0);
    } catch (error) {
      logger.error('Lỗi khi ngắt kết nối database:', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
      process.exit(1);
    }
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Buộc đóng server do timeout graceful shutdown.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
