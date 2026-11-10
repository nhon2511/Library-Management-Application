import prisma from '../config/database';
import { logger } from '../utils/logger';
import { cleanupExpiredReservations } from './reservation-cleanup.job';
import { markOverdueBorrowRecords } from './overdue-check.job';
import { cleanupRefreshSessions } from './refresh-session-cleanup.job';
import { sendDueSoonReminders } from '../services/email.service';

async function main(): Promise<void> {
  const tasks: { name: string; run: () => Promise<number> }[] = [
    { name: 'expired reservations', run: () => cleanupExpiredReservations() },
    { name: 'overdue records', run: () => markOverdueBorrowRecords() },
    { name: 'expired refresh sessions', run: () => cleanupRefreshSessions() },
    { name: 'due soon reminders', run: () => sendDueSoonReminders() },
  ];

  let failed = false;
  for (const task of tasks) {
    try {
      const count = await task.run();
      logger.info(`${task.name}: ${count}`);
    } catch (error) {
      failed = true;
      logger.error(`Scheduled task failed: ${task.name}`, {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }

  if (failed) process.exitCode = 1;
}

void main()
  .catch((error) => {
    process.exitCode = 1;
    logger.error('Scheduled tasks failed', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
