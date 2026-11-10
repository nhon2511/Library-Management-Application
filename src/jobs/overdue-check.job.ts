import * as cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export async function markOverdueBorrowRecords(now = new Date()): Promise<number> {
  const result = await prisma.borrowRecord.updateMany({
    where: {
      status: 'BORROWED',
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });

  return result.count;
}

export const overdueCheckJob = cron.createTask('0 0 * * *', async () => {
  try {
    const updatedRecords = await markOverdueBorrowRecords();
    logger.info(`Đã cập nhật ${updatedRecords} phiếu mượn quá hạn.`);
  } catch (error) {
    logger.error('Lỗi cập nhật phiếu mượn quá hạn.', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
  }
});

export function stopOverdueCheckJob(): void {
  overdueCheckJob.stop();
}
