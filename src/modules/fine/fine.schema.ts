import { z } from 'zod';

export const settleFineSchema = z.object({
  paymentMethod: z.string().min(1, 'Phương thức thanh toán không được để trống'),
});

export const waiveFineSchema = z.object({
  reason: z.string().min(1, 'Lý do miễn giảm không được để trống'),
});
export const fineIdParamSchema = z.object({ id: z.string().min(1) });
export const findFinesQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  status: z.enum(['UNPAID', 'PAID', 'WAIVED']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type SettleFineInput = z.infer<typeof settleFineSchema>;
export type WaiveFineInput = z.infer<typeof waiveFineSchema>;
