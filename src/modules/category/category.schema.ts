import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được để trống').max(100),
  description: z.string().max(500).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
export const categoryIdParamSchema = z.object({ id: z.string().min(1) });
export const searchCategorySchema = z.object({
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
