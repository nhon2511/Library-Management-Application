import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(128, 'Mật khẩu tối đa 128 ký tự'),
  firstName: z.string().min(1, 'Họ không được để trống').max(50),
  lastName: z.string().min(1, 'Tên không được để trống').max(50),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
