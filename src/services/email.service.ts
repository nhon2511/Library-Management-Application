import nodemailer, { Transporter } from 'nodemailer';
import * as cron from 'node-cron';
import prisma from '../config/database';
import { logger } from '../utils/logger';

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
          auth: { user, pass },
        });
      }

      try {
        const account = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
          host: account.smtp.host,
          port: account.smtp.port,
          secure: account.smtp.secure,
          auth: { user: account.user, pass: account.pass },
        });
      } catch (error) {
        logger.warn('Không thể tạo Ethereal test account; email sẽ được bỏ qua.', error);
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
  if (!transporter) return;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'library@example.com',
    to,
    subject,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) logger.info(`Ethereal email preview: ${previewUrl}`);
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
  const oneDayFromNow = new Date(now);
  oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
  const twoDaysFromNow = new Date(now);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  const records = await prisma.borrowRecord.findMany({
    where: {
      status: 'BORROWED',
      dueDate: { gte: oneDayFromNow, lte: twoDaysFromNow },
    },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      items: {
        include: { bookCopy: { include: { book: { select: { title: true } } } } },
      },
    },
  });

  for (const record of records) {
    try {
      await sendOverdueReminder(
        record.user.email,
        `${record.user.lastName} ${record.user.firstName}`,
        record.items.map((item) => ({ title: item.bookCopy.book.title, dueDate: record.dueDate })),
      );
    } catch (error) {
      logger.error(`Không thể gửi email nhắc hạn cho phiếu ${record.id}.`, error);
    }
  }

  return records.length;
}

export const dueSoonReminderJob = cron.createTask('0 8 * * *', async () => {
  try {
    const remindedRecords = await sendDueSoonReminders();
    logger.info(`Đã gửi nhắc hạn cho ${remindedRecords} phiếu mượn.`);
  } catch (error) {
    logger.error('Lỗi job gửi email nhắc hạn.', error);
  }
});

export function stopDueSoonReminderJob(): void {
  dueSoonReminderJob.stop();
}
