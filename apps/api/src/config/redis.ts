import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
});

redis.on('connect', () => console.warn('Redis connected'));
redis.on('error', err => console.error('Redis error:', err));
