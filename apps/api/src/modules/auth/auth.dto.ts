import { z } from 'zod';

export const RegisterSchema = z
  .object({
    name: z.string().min(2).max(100).trim(),
    email: z.string().email().toLowerCase(),
    password: z
      .string()
      .min(8)
      .max(64)
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
    role: z.enum(['STAFF', 'STUDENT']),
    matricNo: z.string().optional(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(d => d.role !== 'STUDENT' || !!d.matricNo, {
    message: 'Matric number is required for students',
    path: ['matricNo'],
  });

export const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8)
      .max(64)
      .regex(/[A-Z]/, 'Must contain an uppercase letter')
      .regex(/[0-9]/, 'Must contain a number'),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
