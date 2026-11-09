import * as cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export async function cleanupExpiredReservations(now = new Date()): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const reservations = await tx.borrowRecord.findMany({
      where: {
        status: 'RESERVED',
        expiresAt: { lt: now },
      },
      select: {
        id: true,
        items: { select: { bookCopyId: true, bookCopy: { select: { bookId: true } } } },
      },
    });

    let releasedCopies = 0;
    for (const reservation of reservations) {
      const updatedRecord = await tx.borrowRecord.updateMany({
        where: { id: reservation.id, status: 'RESERVED' },
        data: { status: 'CANCELLED' },
      });

      if (updatedRecord.count === 0) continue;

      const copiesByBook = new Map<string, string[]>();
      for (const item of reservation.items) {
        const copyIds = copiesByBook.get(item.bookCopy.bookId) || [];
        copyIds.push(item.bookCopyId);
        copiesByBook.set(item.bookCopy.bookId, copyIds);
      }

      for (const [bookId, copyIds] of copiesByBook) {
        const released = await tx.bookCopy.updateMany({
          where: { id: { in: copyIds }, status: 'RESERVED' },
          data: { status: 'AVAILABLE' },
        });

        if (released.count > 0) {
          await tx.book.update({
            where: { id: bookId },
            data: { availableCopies: { increment: released.count } },
          });
          releasedCopies += released.count;
        }
      }
    }

    return releasedCopies;
  });
}

export const reservationCleanupJob = cron.createTask('*/15 * * * *', async () => {
  try {
    const releasedCopies = await cleanupExpiredReservations();
    logger.info(`Đã giải phóng ${releasedCopies} bản sao từ các phiếu đặt mượn hết hạn.`);
  } catch (error) {
    logger.error('Lỗi cleanup phiếu đặt mượn hết hạn.', error);
  }
});

export function stopReservationCleanupJob(): void {
  reservationCleanupJob.stop();
}
