import nodemailer, { Transporter } from 'nodemailer';
import * as cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { config } from '../config';
import { systemSettingService } from '../modules/system-setting/system-setting.service';

export interface BorrowedBookEmail {
  title: string;
  dueDate: Date | null;
}

let transporterPromise: Promise<Transporter | null> | undefined;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ||
      character,
  );
}

function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString('vi-VN') : 'Chưa xác định';
}

async function getTransporter(): Promise<Transporter | null> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const host = process.env.SMTP_HOST;
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;
      const port = Number(process.env.SMTP_PORT || 587);

      if (host && user && pass) {
        return nodemailer.createTransport({
          host,
          port,
          secure: process.env.SMTP_SECURE === 'true',
          requireTLS: config.isProd && process.env.SMTP_SECURE !== 'true',
          auth: { user, pass },
        });
      }

      if (config.isProd) return null;
      try {
        const account = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: { user: account.user, pass: account.pass },
        });
      } catch (error) {
        logger.warn('Không thể tạo Ethereal test account; email sẽ được bỏ qua.', {
          name: error instanceof Error ? error.name : 'UnknownError',
        });
        return null;
      }
    })();
  }

  return transporterPromise;
}

function buildBookList(books: BorrowedBookEmail[], includeDueDate = true): string {
  return books
    .map(
      (book) =>
        `<li><strong>${escapeHtml(book.title)}</strong>${
          includeDueDate ? ` — hạn trả: ${formatDate(book.dueDate)}` : ''
        }</li>`,
    )
    .join('');
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transporter = await getTransporter();
  if (!transporter) throw new Error('SMTP transport unavailable');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'library@example.com',
    to,
    subject,
    html,
  });
}

export async function sendCheckoutConfirmation(
  readerEmail: string,
  readerName: string,
  borrowedBooks: BorrowedBookEmail[],
): Promise<void> {
  await sendEmail(
    readerEmail,
    'Xác nhận mượn sách - Library Management System',
    `<p>Xin chào ${escapeHtml(readerName)},</p>
     <p>Bạn đã mượn thành công các sách sau:</p>
     <ul>${buildBookList(borrowedBooks)}</ul>
     <p>Vui lòng trả sách đúng hạn. Trân trọng.</p>`,
  );
}

export async function sendOverdueReminder(
  readerEmail: string,
  readerName: string,
  overdueBooks: BorrowedBookEmail[],
): Promise<void> {
  await sendEmail(
    readerEmail,
    'Nhắc nhở hạn trả sách - Library Management System',
    `<p>Xin chào ${escapeHtml(readerName)},</p>
     <p>Các sách sau sắp đến hạn trả:</p>
     <ul>${buildBookList(overdueBooks)}</ul>
     <p>Vui lòng sắp xếp trả sách đúng hạn.</p>`,
  );
}

export async function sendDueSoonReminders(now = new Date()): Promise<number> {
  const rules = await systemSettingService.getRules();
  const reminderDeadline = new Date(now);
  reminderDeadline.setDate(reminderDeadline.getDate() + rules.REMINDER_DAYS_BEFORE_DUE);

  const records = await prisma.borrowRecord.findMany({
    where: {
      status: 'BORROWED',
      dueDate: { gte: now, lte: reminderDeadline },
      reminderSentAt: null,
    },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      items: {
        include: { bookCopy: { include: { book: { select: { title: true } } } } },
      },
    },
  });

  let sent = 0;
  for (const record of records) {
    const claimed = await prisma.borrowRecord.updateMany({
      where: { id: record.id, status: 'BORROWED', reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (claimed.count !== 1) continue;
    try {
      await sendOverdueReminder(
        record.user.email,
        `${record.user.lastName} ${record.user.firstName}`,
        record.items.map((item) => ({ title: item.bookCopy.book.title, dueDate: record.dueDate })),
      );
      sent += 1;
    } catch (error) {
      await prisma.borrowRecord.updateMany({
        where: { id: record.id, reminderSentAt: now },
        data: { reminderSentAt: null },
      });
      logger.error('Không thể gửi email nhắc hạn', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    }
  }

  return sent;
}

export const dueSoonReminderJob = cron.createTask('0 8 * * *', async () => {
  try {
    const remindedRecords = await sendDueSoonReminders();
    logger.info(`Đã gửi nhắc hạn cho ${remindedRecords} phiếu mượn.`);
  } catch (error) {
    logger.error('Lỗi job gửi email nhắc hạn.', {
      name: error instanceof Error ? error.name : 'UnknownError',
    });
  }
});

export function stopDueSoonReminderJob(): void {
  dueSoonReminderJob.stop();
}
