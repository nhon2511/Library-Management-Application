import { z } from 'zod';

export const reserveSchema = z.object({
  bookId: z.string().min(1, 'bookId không được để trống'),
});

export const checkoutSchema = z.object({
  userId: z.string().min(1, 'userId không được để trống'),
  copyBarcodes: z
    .array(z.string().min(1))
    .min(1, 'Phải có ít nhất 1 barcode')
    .max(5, 'Tối đa 5 bản sao mỗi lần checkout'),
});

export const returnSchema = z.object({
  items: z
    .array(
      z.object({
        bookCopyId: z.string().min(1),
        condition: z.enum(['GOOD', 'LIGHT_DAMAGE', 'HEAVY_DAMAGE', 'LOST']),
      }),
    )
    .min(1, 'Phải trả ít nhất 1 bản sao'),
});

export type ReserveInput = z.infer<typeof reserveSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ReturnInput = z.infer<typeof returnSchema>;
