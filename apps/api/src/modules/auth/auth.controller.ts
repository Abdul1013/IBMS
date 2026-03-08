import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { AppError } from '../../utils/AppError';
import * as AuthService from './auth.service';
import type { AuthRequest } from '../../middleware/auth';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in ms
  path: '/api/v1/auth',
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.verifyEmail(req.query['token'] as string);
  res.json({ success: true, data: { message: 'Email verified. You can now log in.' } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { accessToken, refreshToken, user } = await AuthService.login(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ success: true, data: { accessToken, user } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const incoming = req.cookies['refreshToken'] as string | undefined;
  if (!incoming) throw new AppError('No refresh token', 401, 'NO_REFRESH_TOKEN');

  const { accessToken, refreshToken } = await AuthService.refreshAccessToken(incoming);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  res.json({ success: true, data: { accessToken } });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user) await AuthService.logout(req.user.userId);
  res.clearCookie('refreshToken', { path: '/api/v1/auth' });
  res.json({ success: true, data: { message: 'Logged out successfully' } });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body.email);
  res.json({
    success: true,
    data: { message: 'If that email exists, a reset link has been sent.' },
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body.token, req.body.password);
  res.json({ success: true, data: { message: 'Password reset successfully. Please log in.' } });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: { user: req.user } });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await AuthService.updateProfile(req.user!.userId, req.body);
  res.json({ success: true, data: { user } });
});
