import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '../../models/User.model';
import { redis } from '../../config/redis';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../utils/emailTemplates';
import {
  BCRYPT_ROUNDS,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
  JWT_REFRESH_EXPIRY_SECONDS,
  EMAIL_VERIFY_EXPIRY_SECONDS,
  PASSWORD_RESET_EXPIRY_SECONDS,
  REDIS_REFRESH_PREFIX,
  REDIS_EMAIL_VERIFY_PREFIX,
  REDIS_RESET_PREFIX,
} from '../../config/constants';
import type { RegisterDto, LoginDto } from './auth.dto';
import type { JwtPayload } from '@ibms/types';

// ─── Password helpers ────────────────────────────────────────────────────────
export const hashPassword = (plain: string) => bcrypt.hash(plain, BCRYPT_ROUNDS);

export const comparePassword = (plain: string, hash: string) => bcrypt.compare(plain, hash);

// ─── Token helpers ───────────────────────────────────────────────────────────
export const generateTokens = (user: IUser) => {
  const payload: JwtPayload = { userId: String(user._id), role: user.role, email: user.email };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRY,
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = (userId: string, token: string) =>
  redis.setex(`${REDIS_REFRESH_PREFIX}${userId}`, JWT_REFRESH_EXPIRY_SECONDS, token);

const generateOpaqueToken = () => crypto.randomBytes(32).toString('hex');

// ─── Register ────────────────────────────────────────────────────────────────
export const register = async (dto: RegisterDto) => {
  const exists = await User.findOne({ email: dto.email });
  if (exists) throw new AppError('Email already registered', 409, 'EMAIL_IN_USE');

  const passwordHash = await hashPassword(dto.password);
  const user = await User.create({
    name: dto.name,
    email: dto.email,
    passwordHash,
    role: dto.role,
    matricNo: dto.matricNo,
  });

  const verifyToken = generateOpaqueToken();
  await redis.setex(
    `${REDIS_EMAIL_VERIFY_PREFIX}${verifyToken}`,
    EMAIL_VERIFY_EXPIRY_SECONDS,
    String(user._id)
  );
  await sendVerificationEmail(user.email, user.name, verifyToken);

  return { id: String(user._id), email: user.email, name: user.name, role: user.role };
};

// ─── Verify Email ────────────────────────────────────────────────────────────
export const verifyEmail = async (token: string) => {
  const userId = await redis.get(`${REDIS_EMAIL_VERIFY_PREFIX}${token}`);
  if (!userId) throw new AppError('Invalid or expired verification link', 400, 'INVALID_TOKEN');

  await User.findByIdAndUpdate(userId, { isVerified: true });
  await redis.del(`${REDIS_EMAIL_VERIFY_PREFIX}${token}`);
};

// ─── Login ───────────────────────────────────────────────────────────────────
export const login = async (dto: LoginDto) => {
  const user = await User.findOne({ email: dto.email, isActive: true, deletedAt: null }).select(
    '+passwordHash'
  );
  if (!user) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  const valid = await comparePassword(dto.password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');

  if (!user.isVerified)
    throw new AppError('Please verify your email before logging in', 403, 'EMAIL_NOT_VERIFIED');

  const { accessToken, refreshToken } = generateTokens(user);
  await storeRefreshToken(String(user._id), refreshToken);
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  return {
    accessToken,
    refreshToken,
    user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
  };
};

// ─── Refresh Token ───────────────────────────────────────────────────────────
export const refreshAccessToken = async (incomingRefresh: string) => {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(incomingRefresh, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  const stored = await redis.get(`${REDIS_REFRESH_PREFIX}${payload.userId}`);
  if (!stored || stored !== incomingRefresh)
    throw new AppError('Refresh token revoked or expired', 401, 'TOKEN_REVOKED');

  const user = await User.findById(payload.userId);
  if (!user || !user.isActive) throw new AppError('User not found', 401, 'USER_NOT_FOUND');

  const { accessToken, refreshToken } = generateTokens(user);
  await storeRefreshToken(payload.userId, refreshToken);
  return { accessToken, refreshToken };
};

// ─── Logout ──────────────────────────────────────────────────────────────────
export const logout = async (userId: string) => {
  await redis.del(`${REDIS_REFRESH_PREFIX}${userId}`);
};

// ─── Forgot Password ─────────────────────────────────────────────────────────
export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email, isActive: true });
  if (!user) return; // Never reveal if email exists (NDPA)

  const resetToken = generateOpaqueToken();
  await redis.setex(
    `${REDIS_RESET_PREFIX}${resetToken}`,
    PASSWORD_RESET_EXPIRY_SECONDS,
    String(user._id)
  );
  await sendPasswordResetEmail(user.email, user.name, resetToken);
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (token: string, newPassword: string) => {
  const userId = await redis.get(`${REDIS_RESET_PREFIX}${token}`);
  if (!userId) throw new AppError('Invalid or expired reset link', 400, 'INVALID_TOKEN');

  const passwordHash = await hashPassword(newPassword);
  await User.findByIdAndUpdate(userId, { passwordHash });
  await redis.del(`${REDIS_RESET_PREFIX}${token}`);
  await redis.del(`${REDIS_REFRESH_PREFIX}${userId}`);
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export interface UpdateProfileDto {
  name?: string;
  faculty?: string;
  hostel?: 'ON_CAMPUS' | 'OFF_CAMPUS' | null;
  department?: string | null;
  notifyCategories?: string[];
}

export const updateProfile = async (userId: string, dto: UpdateProfileDto) => {
  const update: Record<string, unknown> = {};
  if (dto.name !== undefined) update['name'] = dto.name;
  if (dto.faculty !== undefined) update['faculty'] = dto.faculty;
  if (dto.hostel !== undefined) update['hostel'] = dto.hostel ?? undefined;
  if (dto.department !== undefined) update['department'] = dto.department ?? undefined;
  if (dto.notifyCategories !== undefined) update['notifyCategories'] = dto.notifyCategories;

  const user = await User.findByIdAndUpdate(userId, update, { new: true })
    .populate('department', 'name color')
    .populate('notifyCategories', 'name color');
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
};
