import prisma from '../../config/database';
import { ConflictError, NotFoundError } from '../../utils/api-error';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema';
import { PAGINATION } from '../../utils/constants';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class CategoryService {
  async create(data: CreateCategoryInput) {
    const slug = generateSlug(data.name);

    const existing = await prisma.category.findFirst({
      where: { OR: [{ name: data.name }, { slug }] },
    });

    if (existing) {
      throw new ConflictError('Danh mục đã tồn tại');
    }

    return prisma.category.create({
      data: { name: data.name, slug, description: data.description },
    });
  }

  async findAll(params: { search?: string; page?: number; limit?: number }) {
    const page = params.page || PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(params.limit || PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where = params.search
      ? { name: { contains: params.search, mode: 'insensitive' as const } }
      : {};

    const [categories, total] = await Promise.all([
      prisma.category.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      prisma.category.count({ where }),
    ]);

    return {
      categories,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { books: { where: { isDeleted: false }, select: { id: true, title: true } } },
    });

    if (!category) throw new NotFoundError('Không tìm thấy danh mục');
    return category;
  }

  async update(id: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundError('Không tìm thấy danh mục');

    const updateData: Record<string, string | undefined> = { ...data };
    if (data.name) {
      updateData.slug = generateSlug(data.name);
    }

    return prisma.category.update({ where: { id }, data: updateData });
  }

  async delete(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });

    if (!category) throw new NotFoundError('Không tìm thấy danh mục');

    if (category._count.books > 0) {
      throw new ConflictError('Không thể xóa danh mục đang có sách');
    }

    return prisma.category.delete({ where: { id } });
  }
}

export const categoryService = new CategoryService();
