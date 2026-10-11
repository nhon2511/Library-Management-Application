import { z } from 'zod';

export const addCopiesSchema = z.object({
  quantity: z.number().int().min(1, 'Số lượng phải lớn hơn 0').max(100),
  shelfLocation: z.string().max(100).optional(),
});

export const updateCopySchema = z.object({
  shelfLocation: z.string().max(100).optional(),
  condition: z.string().max(255).optional(),
  status: z.enum(['AVAILABLE', 'DAMAGED', 'LOST']).optional(),
});

export type AddCopiesInput = z.infer<typeof addCopiesSchema>;
export type UpdateCopyInput = z.infer<typeof updateCopySchema>;
