import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, generateTokens } from './auth.service';
import type { IUser } from '../../models/User.model';

describe('AuthService — unit', () => {
  it('hashes a password and compares correctly', async () => {
    const hash = await hashPassword('SecurePass1');
    const valid = await comparePassword('SecurePass1', hash);
    const wrong = await comparePassword('WrongPass1', hash);
    expect(valid).toBe(true);
    expect(wrong).toBe(false);
  });

  it('generates access and refresh tokens', () => {
    const fakeUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test',
      email: 't@test.com',
      role: 'STUDENT',
    } as unknown as IUser;
    const { accessToken, refreshToken } = generateTokens(fakeUser);
    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
    expect(accessToken).not.toBe(refreshToken);
  });
});
