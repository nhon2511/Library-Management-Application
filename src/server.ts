import app from './app';
import { config, validateEnv } from './config';
import { logger } from './utils/logger';
import prisma from './config/database';

validateEnv();

const server = app.listen(config.port, () => {
  logger.info(`Server đang chạy trên port ${config.port} ở chế độ ${config.nodeEnv}`);
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Nhận tín hiệu ${signal}. Đang tắt server an toàn...`);

  server.close(async () => {
    logger.info('HTTP server đã đóng.');
    try {
      await prisma.$disconnect();
      logger.info('Đã ngắt kết nối PostgreSQL.');
      process.exit(0);
    } catch (error) {
      logger.error('Lỗi khi ngắt kết nối database:', error);
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
