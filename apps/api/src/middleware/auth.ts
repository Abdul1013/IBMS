import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import type { JwtPayload, Role } from '@ibms/types';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const verifyToken = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError('No token provided', 401, 'UNAUTHORIZED');

  const token = header.split(' ')[1];
  if (!token) throw new AppError('No token provided', 401, 'UNAUTHORIZED');

  try {
    req.user = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }
};

export const requireRole =
  (...roles: Role[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError('Not authenticated', 401, 'UNAUTHORIZED');
    if (!roles.includes(req.user.role))
      throw new AppError('Insufficient permissions', 403, 'INSUFFICIENT_ROLE');
    next();
  };
