import prisma from '../../config/database';
import { BadRequestError, ConflictError, NotFoundError } from '../../utils/api-error';
import { PAGINATION } from '../../utils/constants';
import { ReserveInput, CheckoutInput, ReturnInput } from './borrow.schema';
import { sendCheckoutConfirmation } from '../../services/email.service';
import { logger } from '../../utils/logger';
import { systemSettingService } from '../system-setting/system-setting.service';

export class BorrowService {
  async lookupByBarcode(barcode: string) {
    const copy = await prisma.bookCopy.findUnique({
      where: { barcode },
      include: { book: true },
    });
    if (!copy) {
      throw new NotFoundError('Không tìm thấy bản sao với barcode này');
    }

    const borrowItem = await prisma.borrowItem.findFirst({
      where: {
        bookCopyId: copy.id,
        status: 'BORROWED',
        borrowRecord: { status: { in: ['BORROWED', 'OVERDUE'] } },
      },
      include: {
        borrowRecord: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                qrCode: true,
              },
            },
          },
        },
      },
    });

    if (!borrowItem) {
      throw new NotFoundError('Bản sao này hiện không có phiếu mượn đang hoạt động');
    }

    const record = borrowItem.borrowRecord;
    const now = new Date();
    const dueDate = record.dueDate ? new Date(record.dueDate) : null;
    const overdue = dueDate ? now > dueDate : false;
    const overdueDays =
      overdue && dueDate
        ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return {
      borrowRecordId: record.id,
      bookCopyId: copy.id,
      barcode: copy.barcode,
      bookTitle: copy.book.title,
      bookPrice: copy.book.price,
      reader: {
        id: record.user.id,
        fullName: `${record.user.lastName} ${record.user.firstName}`,
        email: record.user.email,
        qrCode: record.user.qrCode,
      },
      borrowDate: record.borrowDate,
      dueDate: record.dueDate,
      status: record.status,
      overdue,
      overdueDays,
    };
  }

  async reserve(userId: string, data: ReserveInput) {
    return prisma.$transaction(
      async (tx) => {
        const rules = await systemSettingService.getRules(tx);
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundError('Không tìm thấy người dùng');
        if (user.status === 'SUSPENDED') {
          throw new BadRequestError('Tài khoản đã bị tạm khóa');
        }

        const activeBorrows = await tx.borrowItem.count({
          where: {
            borrowRecord: { userId, status: { in: ['BORROWED', 'RESERVED', 'OVERDUE'] } },
            status: 'BORROWED',
          },
        });
        if (activeBorrows >= rules.MAX_BORROW_LIMIT) {
          throw new BadRequestError(`Đã đạt giới hạn mượn (${rules.MAX_BORROW_LIMIT})`);
        }

        const unpaidFines = await tx.fine.aggregate({
          where: { userId, status: 'UNPAID' },
          _sum: { amount: true },
        });
        if ((unpaidFines._sum.amount || 0) > rules.UNPAID_FINE_THRESHOLD) {
          throw new BadRequestError('Bạn có tiền phạt chưa thanh toán vượt ngưỡng');
        }

        const book = await tx.book.findFirst({ where: { id: data.bookId, isDeleted: false } });
        if (!book) throw new NotFoundError('Không tìm thấy sách');
        if (book.availableCopies <= 0) throw new ConflictError('Sách không còn bản sao khả dụng');

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + rules.RESERVATION_EXPIRY_HOURS);

        const copy = await tx.bookCopy.findFirst({
          where: { bookId: data.bookId, status: 'AVAILABLE' },
        });
        if (!copy) throw new ConflictError('Không tìm thấy bản sao khả dụng');

        const claimedCopy = await tx.bookCopy.updateMany({
          where: { id: copy.id, status: 'AVAILABLE' },
          data: { status: 'RESERVED' },
        });
        if (claimedCopy.count !== 1) {
          throw new ConflictError('Bản sao vừa được người khác đặt mượn');
        }

        const updatedBook = await tx.book.updateMany({
          where: { id: data.bookId, availableCopies: { gt: 0 } },
          data: { availableCopies: { decrement: 1 } },
        });
        if (updatedBook.count !== 1) {
          throw new ConflictError('Sách không còn bản sao khả dụng');
        }

        return tx.borrowRecord.create({
          data: {
            userId,
            status: 'RESERVED',
            expiresAt,
            items: { create: { bookCopyId: copy.id } },
          },
          include: { items: { include: { bookCopy: { include: { book: true } } } } },
        });
      },
      { maxWait: 15000, timeout: 15000 },
    );
  }

  async checkout(librarianId: string, data: CheckoutInput) {
    const record = await prisma.$transaction(
      async (tx) => {
        const rules = await systemSettingService.getRules(tx);
        const user = await tx.user.findUnique({ where: { id: data.userId } });
        if (!user) throw new NotFoundError('Không tìm thấy độc giả');
        if (user.status !== 'ACTIVE' || user.role !== 'READER') {
          throw new BadRequestError('Độc giả không hoạt động');
        }

        const activeItems = await tx.borrowItem.count({
          where: {
            borrowRecord: { userId: data.userId, status: { in: ['BORROWED', 'OVERDUE'] } },
            status: 'BORROWED',
          },
        });
        const reservedElsewhere = await tx.borrowItem.count({
          where: {
            borrowRecord: {
              userId: data.userId,
              status: 'RESERVED',
              expiresAt: { gt: new Date() },
            },
            bookCopy: { barcode: { notIn: data.copyBarcodes } },
          },
        });
        if (activeItems + reservedElsewhere + data.copyBarcodes.length > rules.MAX_BORROW_LIMIT) {
          throw new BadRequestError(`Đã đạt giới hạn mượn (${rules.MAX_BORROW_LIMIT})`);
        }
        const unpaidFines = await tx.fine.aggregate({
          where: { userId: data.userId, status: 'UNPAID' },
          _sum: { amount: true },
        });
        if ((unpaidFines._sum.amount || 0) > rules.UNPAID_FINE_THRESHOLD) {
          throw new BadRequestError('Độc giả có tiền phạt chưa thanh toán vượt ngưỡng');
        }

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
          if (c.book.isDeleted) throw new ConflictError('Sách đã bị xóa');
          if (c.status === 'RESERVED') {
            const reservation = await tx.borrowItem.findFirst({
              where: {
                bookCopyId: c.id,
                borrowRecord: {
                  userId: data.userId,
                  status: 'RESERVED',
                  expiresAt: { gt: new Date() },
                },
              },
              select: { borrowRecordId: true },
            });
            if (!reservation)
              throw new ConflictError(
                'Bản sao đã được đặt bởi độc giả khác hoặc phiếu đặt đã hết hạn',
              );
            await tx.borrowRecord.updateMany({
              where: { id: reservation.borrowRecordId, status: 'RESERVED' },
              data: { status: 'CANCELLED' },
            });
          }
        }

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + rules.LOAN_DAYS);

        for (const copy of copies) {
          const claimed = await tx.bookCopy.updateMany({
            where: { id: copy.id, status: copy.status },
            data: { status: 'BORROWED' },
          });
          if (claimed.count !== 1) throw new ConflictError('Bản sao vừa được mượn bởi người khác');
        }

        for (const c of copies) {
          const updatedBook = await tx.book.updateMany({
            where: {
              id: c.bookId,
              isDeleted: false,
              ...(c.status === 'AVAILABLE' ? { availableCopies: { gt: 0 } } : {}),
            },
            data:
              c.status === 'AVAILABLE'
                ? { availableCopies: { decrement: 1 } }
                : { updatedAt: new Date() },
          });
          if (updatedBook.count !== 1) throw new ConflictError('Sách không còn khả dụng');
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
      },
      { maxWait: 15000, timeout: 15000 },
    );

    try {
      await sendCheckoutConfirmation(
        record.user.email,
        `${record.user.lastName} ${record.user.firstName}`,
        record.items.map((item) => ({
          title: item.bookCopy.book.title,
          dueDate: record.dueDate,
        })),
      );
    } catch (error) {
      logger.error('Không thể gửi email xác nhận phiếu mượn', {
        name: error instanceof Error ? error.name : 'UnknownError',
      });
    }

    return record;
  }

  async returnBooks(recordId: string, _librarianId: string, data: ReturnInput) {
    return prisma.$transaction(async (tx) => {
      const rules = await systemSettingService.getRules(tx);
      const record = await tx.borrowRecord.findUnique({
        where: { id: recordId },
        include: { items: { include: { bookCopy: { include: { book: true } } } } },
      });
      if (!record) throw new NotFoundError('Không tìm thấy phiếu mượn');
      if (!['BORROWED', 'OVERDUE'].includes(record.status))
        throw new BadRequestError('Phiếu không ở trạng thái đang mượn');
      if (new Set(data.items.map((item) => item.bookCopyId)).size !== data.items.length) {
        throw new BadRequestError('Có bản sao trùng lặp trong danh sách trả');
      }

      const now = new Date();

      for (const ri of data.items) {
        const item = record.items.find((i) => i.bookCopyId === ri.bookCopyId);
        if (!item) throw new NotFoundError(`Bản sao ${ri.bookCopyId} không thuộc phiếu này`);
        if (item.status !== 'BORROWED') throw new BadRequestError('Bản sao đã được xử lý trước đó');

        const itemStatus =
          ri.condition === 'LOST'
            ? ('LOST' as const)
            : ri.condition.includes('DAMAGE')
              ? ('DAMAGED' as const)
              : ('RETURNED' as const);

        const returnedItem = await tx.borrowItem.updateMany({
          where: { id: item.id, status: 'BORROWED' },
          data: { status: itemStatus, returnDate: now, returnCondition: ri.condition },
        });
        if (returnedItem.count !== 1)
          throw new ConflictError('Bản sao vừa được trả bởi request khác');

        const copyStatus =
          ri.condition === 'LOST'
            ? ('LOST' as const)
            : ri.condition.includes('DAMAGE')
              ? ('DAMAGED' as const)
              : ('AVAILABLE' as const);

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
          const days =
            Math.floor((now.getTime() - record.dueDate.getTime()) / msDay) -
            rules.GRACE_PERIOD_DAYS;
          if (days > 0) {
            let amt = Math.round(days * rules.OVERDUE_FINE_PER_DAY);
            const cap = Math.round(item.bookCopy.book.price * rules.FINE_CAP_PERCENTAGE);
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
              userId: record.userId,
              borrowRecordId: recordId,
              type: 'DAMAGE',
              amount: Math.round(item.bookCopy.book.price * rules.DAMAGE_LIGHT_PERCENTAGE),
              reason: 'Hỏng nhẹ',
            },
          });
        } else if (ri.condition === 'HEAVY_DAMAGE') {
          await tx.fine.create({
            data: {
              userId: record.userId,
              borrowRecordId: recordId,
              type: 'DAMAGE',
              amount: Math.round(item.bookCopy.book.price * rules.DAMAGE_HEAVY_PERCENTAGE),
              reason: 'Hỏng nặng',
            },
          });
        } else if (ri.condition === 'LOST') {
          await tx.fine.create({
            data: {
              userId: record.userId,
              borrowRecordId: recordId,
              type: 'LOSS',
              amount: item.bookCopy.book.price + rules.LOSS_PROCESSING_FEE,
              reason: 'Mất sách',
            },
          });
        }
      }

      const allReturned = record.items.every(
        (i) => i.status !== 'BORROWED' || data.items.some((d) => d.bookCopyId === i.bookCopyId),
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
    const rules = await systemSettingService.getRules();
    const record = await prisma.borrowRecord.findUnique({ where: { id: recordId } });
    if (!record) throw new NotFoundError('Không tìm thấy phiếu mượn');
    if (record.userId !== userId) throw new BadRequestError('Không có quyền gia hạn');
    if (record.status !== 'BORROWED') throw new BadRequestError('Chỉ gia hạn sách đang mượn');
    if (record.renewCount >= rules.MAX_RENEWALS) {
      throw new BadRequestError(`Đã đạt giới hạn gia hạn (${rules.MAX_RENEWALS} lần)`);
    }
    if (record.dueDate && new Date() > record.dueDate) {
      throw new BadRequestError('Không thể gia hạn sách đã quá hạn');
    }
    if (!record.dueDate) throw new BadRequestError('Phiếu mượn chưa có hạn trả');

    const newDue = new Date(record.dueDate);
    newDue.setDate(newDue.getDate() + rules.RENEWAL_DAYS);

    const updated = await prisma.borrowRecord.updateMany({
      where: {
        id: recordId,
        status: 'BORROWED',
        dueDate: { equals: record.dueDate, gt: new Date() },
        renewCount: record.renewCount,
      },
      data: { dueDate: newDue, renewCount: { increment: 1 }, reminderSentAt: null },
    });
    if (updated.count !== 1) throw new ConflictError('Phiếu mượn vừa thay đổi, vui lòng thử lại');
    return prisma.borrowRecord.findUniqueOrThrow({
      where: { id: recordId },
      include: { items: { include: { bookCopy: { include: { book: true } } } } },
    });
  }

  async getMyBorrows(
    userId: string,
    params: {
      status?: string;
      page?: number;
      limit?: number;
    },
  ) {
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
