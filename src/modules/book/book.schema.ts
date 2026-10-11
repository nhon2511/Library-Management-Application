import { z } from 'zod';

export const createBookSchema = z.object({
  isbn: z.string().min(1, 'ISBN không được để trống'),
  title: z.string().min(1, 'Tiêu đề không được để trống').max(255),
  author: z.string().min(1, 'Tác giả không được để trống').max(255),
  publisher: z.string().max(255).optional(),
  publishedYear: z.number().int().min(1000).max(2100).optional(),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().url().optional(),
  price: z.number().min(0, 'Giá không được âm'),
  categoryId: z.string().min(1, 'Danh mục không được để trống'),
});

export const updateBookSchema = createBookSchema.partial();

export const searchBookSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  available: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['title', 'author', 'createdAt', 'publishedYear']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
