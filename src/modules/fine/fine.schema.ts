import { z } from 'zod';

export const settleFineSchema = z.object({
  paymentMethod: z.string().min(1, 'Phương thức thanh toán không được để trống'),
});

export const waiveFineSchema = z.object({
  reason: z.string().min(1, 'Lý do miễn giảm không được để trống'),
});

export type SettleFineInput = z.infer<typeof settleFineSchema>;
export type WaiveFineInput = z.infer<typeof waiveFineSchema>;
