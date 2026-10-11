import { z } from 'zod';

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
  search: z.string().optional(),
  role: z.enum(['READER', 'LIBRARIAN', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
