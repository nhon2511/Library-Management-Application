import { randomBytes } from 'crypto';
import prisma from '../../config/database';
import { ConflictError, NotFoundError } from '../../utils/api-error';
import { AddCopiesInput, UpdateCopyInput } from './book-copy.schema';
import QRCode from 'qrcode';

function generateBarcode(): string {
  return `LIB-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export class BookCopyService {
  async getBarcodeImage(copyId: string) {
    const copy = await prisma.bookCopy.findUnique({
      where: { id: copyId },
      select: { barcode: true },
    });

    if (!copy) {
      throw new NotFoundError('Không tìm thấy bản sao');
    }

    const dataUrl = await QRCode.toDataURL(copy.barcode, { width: 300, margin: 2 });
    return dataUrl;
  }

  async addCopies(bookId: string, data: AddCopiesInput) {
    const book = await prisma.book.findFirst({ where: { id: bookId, isDeleted: false } });
    if (!book) throw new NotFoundError('Không tìm thấy sách');

    const copies = Array.from({ length: data.quantity }, () => ({
      bookId,
      barcode: generateBarcode(),
      shelfLocation: data.shelfLocation || null,
    }));

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.bookCopy.createMany({ data: copies });

      const updated = await tx.book.updateMany({
        where: { id: bookId, isDeleted: false },
        data: {
          totalCopies: { increment: data.quantity },
          availableCopies: { increment: data.quantity },
        },
      });
      if (updated.count !== 1) throw new ConflictError('Sách vừa được xóa');

      return created;
    });

    const newCopies = await prisma.bookCopy.findMany({
      where: { bookId },
      orderBy: { createdAt: 'desc' },
      take: data.quantity,
    });

    return { count: result.count, copies: newCopies };
  }

  async findByBook(bookId: string) {
    const book = await prisma.book.findFirst({ where: { id: bookId, isDeleted: false } });
    if (!book) throw new NotFoundError('Không tìm thấy sách');

    return prisma.bookCopy.findMany({
      where: { bookId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByBarcode(barcode: string) {
    const copy = await prisma.bookCopy.findUnique({
      where: { barcode },
      include: { book: { include: { category: true } } },
    });

    if (!copy) throw new NotFoundError('Không tìm thấy bản sao');
    return copy;
  }

  async update(id: string, data: UpdateCopyInput) {
    return prisma.$transaction(async (tx) => {
      const copy = await tx.bookCopy.findUnique({ where: { id }, include: { book: true } });
      if (!copy || copy.book.isDeleted) throw new NotFoundError('Không tìm thấy bản sao');
      if (data.status && ['BORROWED', 'RESERVED'].includes(copy.status)) {
        throw new ConflictError('Không thể đổi trạng thái bản sao đang được mượn hoặc đặt');
      }
      const updated = await tx.bookCopy.updateMany({ where: { id, status: copy.status }, data });
      if (updated.count !== 1) throw new ConflictError('Bản sao vừa thay đổi');
      if (data.status && data.status !== copy.status) {
        const change =
          (data.status === 'AVAILABLE' ? 1 : 0) - (copy.status === 'AVAILABLE' ? 1 : 0);
        if (change !== 0) {
          await tx.book.update({
            where: { id: copy.bookId },
            data: { availableCopies: { increment: change } },
          });
        }
      }
      return tx.bookCopy.findUniqueOrThrow({ where: { id } });
    });
  }
}

export const bookCopyService = new BookCopyService();
