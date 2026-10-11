import prisma from '../../config/database';

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
}

export const reportService = new ReportService();
