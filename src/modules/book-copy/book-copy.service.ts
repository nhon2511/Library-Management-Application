import { randomBytes } from 'crypto';
import prisma from '../../config/database';
import { NotFoundError } from '../../utils/api-error';
import { AddCopiesInput, UpdateCopyInput } from './book-copy.schema';

function generateBarcode(): string {
  return `LIB-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

export class BookCopyService {
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

      await tx.book.update({
        where: { id: bookId },
        data: {
          totalCopies: { increment: data.quantity },
          availableCopies: { increment: data.quantity },
        },
      });

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
    const copy = await prisma.bookCopy.findUnique({ where: { id } });
    if (!copy) throw new NotFoundError('Không tìm thấy bản sao');

    return prisma.bookCopy.update({ where: { id }, data });
  }
}

export const bookCopyService = new BookCopyService();
