import * as cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export async function cleanupRefreshSessions(now = new Date()): Promise<number> {
  const result = await prisma.refreshSession.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return result.count;
}

export const refreshSessionCleanupJob = cron.createTask('0 2 * * *', async () => {
  try {
    await cleanupRefreshSessions();
  } catch (error) {
    logger.error('Lỗi dọn phiên refresh hết hạn', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
  }
});

export function stopRefreshSessionCleanupJob(): void {
  refreshSessionCleanupJob.stop();
}
