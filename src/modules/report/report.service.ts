import prisma from '../../config/database';
import ExcelJS from 'exceljs';
import { Response } from 'express';

export class ReportService {
  async getOverview() {
    const [
      totalBooks,
      totalCopies,
      availableCopies,
      activeBorrows,
      overdueBorrows,
      totalUsers,
      unpaidFines,
    ] = await Promise.all([
      prisma.book.count({ where: { isDeleted: false } }),
      prisma.bookCopy.count(),
      prisma.bookCopy.count({ where: { status: 'AVAILABLE' } }),
      prisma.borrowRecord.count({ where: { status: 'BORROWED' } }),
      prisma.borrowRecord.count({
        where: {
          status: 'BORROWED',
          dueDate: { lt: new Date() },
        },
      }),
      prisma.user.count({ where: { role: 'READER' } }),
      prisma.fine.aggregate({
        where: { status: 'UNPAID' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalBooks,
      totalCopies,
      availableCopies,
      activeBorrows,
      overdueBorrows,
      totalUsers,
      unpaidFinesTotal: unpaidFines._sum.amount || 0,
    };
  }

  async getTopBooks() {
    const topBooks = await prisma.borrowItem.groupBy({
      by: ['bookCopyId'],
      _count: { id: true },
    });

    const copyIds = topBooks.map((item) => item.bookCopyId);
    const copies = await prisma.bookCopy.findMany({
      where: { id: { in: copyIds } },
      include: { book: true },
    });

    const bookMap = new Map<string, { title: string; author: string; borrowCount: number }>();
    for (const item of topBooks) {
      const copy = copies.find((c) => c.id === item.bookCopyId);
      if (!copy || copy.book.isDeleted) continue;

      const existing = bookMap.get(copy.bookId);
      if (existing) {
        existing.borrowCount += item._count.id;
      } else {
        bookMap.set(copy.bookId, {
          title: copy.book.title,
          author: copy.book.author,
          borrowCount: item._count.id,
        });
      }
    }

    return Array.from(bookMap.entries())
      .map(([bookId, data]) => ({ bookId, ...data }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10);
  }

  async getMonthlyTrends() {
    const now = new Date();
    const months: { year: number; month: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        label: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    const startDate = new Date(months[0].year, months[0].month - 1, 1);

    const [checkouts, returns] = await Promise.all([
      prisma.borrowRecord.findMany({
        where: {
          borrowDate: { gte: startDate },
          status: { in: ['BORROWED', 'RETURNED', 'OVERDUE'] },
        },
        select: { borrowDate: true },
      }),
      prisma.borrowRecord.findMany({
        where: {
          returnDate: { gte: startDate },
          status: 'RETURNED',
        },
        select: { returnDate: true },
      }),
    ]);

    return months.map((m) => {
      const checkoutCount = checkouts.filter((r) => {
        if (!r.borrowDate) return false;
        const d = new Date(r.borrowDate);
        return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
      }).length;

      const returnCount = returns.filter((r) => {
        if (!r.returnDate) return false;
        const d = new Date(r.returnDate);
        return d.getFullYear() === m.year && d.getMonth() + 1 === m.month;
      }).length;

      return { month: m.label, checkouts: checkoutCount, returns: returnCount };
    });
  }

  async getCategoriesRatio() {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        books: {
          where: { isDeleted: false },
          select: {
            id: true,
            _count: { select: { copies: true } },
          },
        },
      },
    });

    return categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      bookCount: cat.books.length,
      copyCount: cat.books.reduce((sum, book) => sum + book._count.copies, 0),
    }));
  }

  async exportExcel(res: Response) {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', 'attachment; filename=borrows-report.xlsx');
    res.setHeader('Cache-Control', 'no-store');

    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: true });
    workbook.creator = 'Library Management System';
    const sheet = workbook.addWorksheet('Phiếu mượn đang hoạt động');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 6 },
      { header: 'Mã phiếu', key: 'recordId', width: 28 },
      { header: 'Tên độc giả', key: 'readerName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Tên sách', key: 'bookTitle', width: 35 },
      { header: 'Barcode', key: 'barcode', width: 28 },
      { header: 'Ngày mượn', key: 'borrowDate', width: 16 },
      { header: 'Ngày hẹn trả', key: 'dueDate', width: 16 },
      { header: 'Trạng thái', key: 'status', width: 14 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();

    let stt = 1;
    let cursor: string | undefined;
    while (true) {
      const records = await prisma.borrowRecord.findMany({
        where: { status: { in: ['BORROWED', 'OVERDUE'] } },
        select: {
          id: true,
          status: true,
          borrowDate: true,
          dueDate: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          items: {
            select: { bookCopy: { select: { barcode: true, book: { select: { title: true } } } } },
          },
        },
        orderBy: [{ borrowDate: 'desc' }, { id: 'desc' }],
        take: 200,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (records.length === 0) break;
      for (const record of records) {
        for (const item of record.items) {
          sheet
            .addRow({
              stt,
              recordId: record.id,
              readerName: `${record.user.lastName} ${record.user.firstName}`,
              email: record.user.email,
              bookTitle: item.bookCopy.book.title,
              barcode: item.bookCopy.barcode,
              borrowDate: record.borrowDate
                ? new Date(record.borrowDate).toLocaleDateString('vi-VN')
                : '',
              dueDate: record.dueDate ? new Date(record.dueDate).toLocaleDateString('vi-VN') : '',
              status: record.status,
            })
            .commit();
          stt++;
        }
      }
      cursor = records[records.length - 1].id;
    }
    sheet.commit();
    await workbook.commit();
  }
}

export const reportService = new ReportService();
