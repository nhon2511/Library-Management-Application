import prisma from '../../config/database';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../utils/api-error';
import { DEFAULTS, PAGINATION } from '../../utils/constants';
import { ReserveInput, CheckoutInput, ReturnInput } from './borrow.schema';

export class BorrowService {
  async reserve(userId: string, data: ReserveInput) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundError('Không tìm thấy người dùng');
      if (user.status === 'SUSPENDED') {
        throw new BadRequestError('Tài khoản đã bị tạm khóa');
      }

      const activeBorrows = await tx.borrowRecord.count({
        where: { userId, status: { in: ['BORROWED', 'RESERVED'] } },
      });
      if (activeBorrows >= DEFAULTS.MAX_BORROW_LIMIT) {
        throw new BadRequestError(`Đã đạt giới hạn mượn (${DEFAULTS.MAX_BORROW_LIMIT})`);
      }

      const unpaidFines = await tx.fine.aggregate({
        where: { userId, status: 'UNPAID' },
        _sum: { amount: true },
      });
      if ((unpaidFines._sum.amount || 0) > DEFAULTS.UNPAID_FINE_THRESHOLD) {
        throw new BadRequestError('Bạn có tiền phạt chưa thanh toán vượt ngưỡng');
      }

      const book = await tx.book.findFirst({ where: { id: data.bookId, isDeleted: false } });
      if (!book) throw new NotFoundError('Không tìm thấy sách');
      if (book.availableCopies <= 0) throw new ConflictError('Sách không còn bản sao khả dụng');

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + DEFAULTS.RESERVATION_EXPIRY_HOURS);

      const copy = await tx.bookCopy.findFirst({
        where: { bookId: data.bookId, status: 'AVAILABLE' },
      });
      if (!copy) throw new ConflictError('Không tìm thấy bản sao khả dụng');

      await tx.bookCopy.update({ where: { id: copy.id }, data: { status: 'RESERVED' } });
      await tx.book.update({
        where: { id: data.bookId },
        data: { availableCopies: { decrement: 1 } },
      });

      return tx.borrowRecord.create({
        data: {
          userId,
          status: 'RESERVED',
          expiresAt,
          items: { create: { bookCopyId: copy.id } },
        },
        include: { items: { include: { bookCopy: { include: { book: true } } } } },
      });
    });
  }

  async checkout(librarianId: string, data: CheckoutInput) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: data.userId } });
      if (!user) throw new NotFoundError('Không tìm thấy độc giả');

      const barcodeSet = new Set(data.copyBarcodes);
      if (barcodeSet.size !== data.copyBarcodes.length) {
        throw new BadRequestError('Có barcode trùng lặp');
      }

      const copies = await tx.bookCopy.findMany({
        where: { barcode: { in: data.copyBarcodes } },
        include: { book: true },
      });
      if (copies.length !== data.copyBarcodes.length) {
        throw new NotFoundError('Một hoặc nhiều barcode không tồn tại');
      }

      for (const c of copies) {
        if (c.status !== 'AVAILABLE' && c.status !== 'RESERVED') {
          throw new ConflictError(`Bản sao ${c.barcode} không khả dụng (${c.status})`);
        }
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      await tx.bookCopy.updateMany({
        where: { id: { in: copies.map((c) => c.id) } },
        data: { status: 'BORROWED' },
      });

      for (const c of copies) {
        if (c.status === 'AVAILABLE') {
          await tx.book.update({
            where: { id: c.bookId },
            data: { availableCopies: { decrement: 1 } },
          });
        }
      }

      return tx.borrowRecord.create({
        data: {
          userId: data.userId,
          librarianId,
          status: 'BORROWED',
          borrowDate: new Date(),
          dueDate,
          items: {
            create: copies.map((c) => ({ bookCopyId: c.id, status: 'BORROWED' as const })),
          },
        },
        include: {
          items: { include: { bookCopy: { include: { book: true } } } },
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      });
    });
  }

  async returnBooks(recordId: string, _librarianId: string, data: ReturnInput) {
    return prisma.$transaction(async (tx) => {
      const record = await tx.borrowRecord.findUnique({
        where: { id: recordId },
        include: { items: { include: { bookCopy: { include: { book: true } } } } },
      });
      if (!record) throw new NotFoundError('Không tìm thấy phiếu mượn');
      if (record.status === 'RETURNED') throw new BadRequestError('Phiếu đã được trả');

      const now = new Date();

      for (const ri of data.items) {
        const item = record.items.find((i) => i.bookCopyId === ri.bookCopyId);
        if (!item) throw new NotFoundError(`Bản sao ${ri.bookCopyId} không thuộc phiếu này`);

        const itemStatus = ri.condition === 'LOST' ? 'LOST' as const
          : ri.condition.includes('DAMAGE') ? 'DAMAGED' as const : 'RETURNED' as const;

        await tx.borrowItem.update({
          where: { id: item.id },
          data: { status: itemStatus, returnDate: now, returnCondition: ri.condition },
        });

        const copyStatus = ri.condition === 'LOST' ? 'LOST' as const
          : ri.condition.includes('DAMAGE') ? 'DAMAGED' as const : 'AVAILABLE' as const;

        await tx.bookCopy.update({
          where: { id: ri.bookCopyId },
          data: { status: copyStatus },
        });

        if (copyStatus === 'AVAILABLE') {
          await tx.book.update({
            where: { id: item.bookCopy.bookId },
            data: { availableCopies: { increment: 1 } },
          });
        }

        // Overdue fine
        if (record.dueDate && now > record.dueDate && ri.condition === 'GOOD') {
          const msDay = 86400000;
          const days = Math.floor(
            (now.getTime() - record.dueDate.getTime()) / msDay,
          ) - DEFAULTS.GRACE_PERIOD_DAYS;
          if (days > 0) {
            let amt = days * DEFAULTS.OVERDUE_FINE_PER_DAY;
            const cap = item.bookCopy.book.price * DEFAULTS.FINE_CAP_PERCENTAGE;
            if (amt > cap) amt = cap;
            await tx.fine.create({
              data: {
                userId: record.userId,
                borrowRecordId: recordId,
                type: 'OVERDUE',
                amount: amt,
                reason: `Trả trễ ${days} ngày`,
              },
            });
          }
        }

        if (ri.condition === 'LIGHT_DAMAGE') {
          await tx.fine.create({
            data: {
              userId: record.userId, borrowRecordId: recordId,
              type: 'DAMAGE',
              amount: item.bookCopy.book.price * DEFAULTS.DAMAGE_LIGHT_PERCENTAGE,
              reason: 'Hỏng nhẹ',
            },
          });
        } else if (ri.condition === 'HEAVY_DAMAGE') {
          await tx.fine.create({
            data: {
              userId: record.userId, borrowRecordId: recordId,
              type: 'DAMAGE',
              amount: item.bookCopy.book.price * DEFAULTS.DAMAGE_HEAVY_PERCENTAGE,
              reason: 'Hỏng nặng',
            },
          });
        } else if (ri.condition === 'LOST') {
          await tx.fine.create({
            data: {
              userId: record.userId, borrowRecordId: recordId,
              type: 'LOSS',
              amount: item.bookCopy.book.price + DEFAULTS.LOSS_PROCESSING_FEE,
              reason: 'Mất sách',
            },
          });
        }
      }

      const allReturned = record.items.every(
        (i) => data.items.some((d) => d.bookCopyId === i.bookCopyId),
      );

      return tx.borrowRecord.update({
        where: { id: recordId },
        data: {
          status: allReturned ? 'RETURNED' : 'BORROWED',
          returnDate: allReturned ? now : undefined,
        },
        include: {
          items: { include: { bookCopy: { include: { book: true } } } },
          fines: true,
        },
      });
    });
  }

  async renew(recordId: string, userId: string) {
    const record = await prisma.borrowRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundError('Không tìm thấy phiếu mượn');
    if (record.userId !== userId) throw new BadRequestError('Không có quyền gia hạn');
    if (record.status !== 'BORROWED') throw new BadRequestError('Chỉ gia hạn sách đang mượn');
    if (record.renewCount >= DEFAULTS.MAX_RENEWALS) {
      throw new BadRequestError(`Đã đạt giới hạn gia hạn (${DEFAULTS.MAX_RENEWALS} lần)`);
    }
    if (record.dueDate && new Date() > record.dueDate) {
      throw new BadRequestError('Không thể gia hạn sách đã quá hạn');
    }

    const newDue = new Date(record.dueDate || new Date());
    newDue.setDate(newDue.getDate() + DEFAULTS.RENEWAL_DAYS);

    return prisma.borrowRecord.update({
      where: { id: recordId },
      data: { dueDate: newDue, renewCount: { increment: 1 } },
      include: { items: { include: { bookCopy: { include: { book: true } } } } },
    });
  }

  async getMyBorrows(userId: string, params: {
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(params.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { userId };
    if (params.status) where.status = params.status;

    const [records, total] = await Promise.all([
      prisma.borrowRecord.findMany({
        where,
        include: {
          items: { include: { bookCopy: { include: { book: true } } } },
          fines: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.borrowRecord.count({ where }),
    ]);

    return {
      records,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

export const borrowService = new BorrowService();

