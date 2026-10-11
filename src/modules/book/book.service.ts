import prisma from '../../config/database';
import { ConflictError, NotFoundError } from '../../utils/api-error';
import { CreateBookInput, UpdateBookInput } from './book.schema';
import { PAGINATION } from '../../utils/constants';
import { Prisma } from '@prisma/client';

export class BookService {
  async create(data: CreateBookInput) {
    const existing = await prisma.book.findUnique({ where: { isbn: data.isbn } });
    if (existing) throw new ConflictError('ISBN đã tồn tại');

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new NotFoundError('Danh mục không tồn tại');

    return prisma.book.create({ data, include: { category: true } });
  }

  async findAll(params: {
    search?: string;
    categoryId?: string;
    available?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(params.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: Prisma.BookWhereInput = { isDeleted: false };

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { author: { contains: params.search, mode: 'insensitive' } },
        { isbn: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.available) where.availableCopies = { gt: 0 };

    const orderBy: Prisma.BookOrderByWithRelationInput = {
      [params.sortBy || 'createdAt']: params.sortOrder || 'desc',
    };

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        include: { category: { select: { id: true, name: true, slug: true } } },
        skip,
        take: limit,
        orderBy,
      }),
      prisma.book.count({ where }),
    ]);

    return {
      books,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const book = await prisma.book.findFirst({
      where: { id, isDeleted: false },
      include: {
        category: true,
        copies: { select: { id: true, barcode: true, status: true, shelfLocation: true } },
      },
    });

    if (!book) throw new NotFoundError('Không tìm thấy sách');
    return book;
  }

  async update(id: string, data: UpdateBookInput) {
    const book = await prisma.book.findFirst({ where: { id, isDeleted: false } });
    if (!book) throw new NotFoundError('Không tìm thấy sách');

    if (data.isbn && data.isbn !== book.isbn) {
      const dup = await prisma.book.findUnique({ where: { isbn: data.isbn } });
      if (dup) throw new ConflictError('ISBN đã tồn tại');
    }

    return prisma.book.update({ where: { id }, data, include: { category: true } });
  }

  async softDelete(id: string) {
    const book = await prisma.book.findFirst({ where: { id, isDeleted: false } });
    if (!book) throw new NotFoundError('Không tìm thấy sách');

    // Check if any copy is borrowed
    const borrowed = await prisma.bookCopy.count({
      where: { bookId: id, status: { in: ['BORROWED', 'RESERVED'] } },
    });

    if (borrowed > 0) {
      throw new ConflictError('Không thể xóa sách đang có bản sao được mượn/đặt');
    }

    return prisma.book.update({ where: { id }, data: { isDeleted: true } });
  }
}

export const bookService = new BookService();
