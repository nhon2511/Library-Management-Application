import { z } from 'zod';

export const lookupByQrCodeSchema = z.object({
  qrCode: z.string().trim().min(1, 'qrCode không được để trống'),
});

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'id không được để trống'),
});

export type LookupByQrCodeQuery = z.infer<typeof lookupByQrCodeSchema>;

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']),
  reason: z.string().optional(),
});

export const searchUsersSchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(['READER', 'LIBRARIAN', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
