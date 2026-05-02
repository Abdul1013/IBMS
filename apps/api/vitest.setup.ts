import { vi, inject } from 'vitest';
import RedisMock from 'ioredis-mock';

const mongoUri = inject('MONGO_URI');
if (mongoUri) process.env['MONGO_URI'] = mongoUri;

vi.mock('ioredis', () => ({
  __esModule: true,
  default: RedisMock,
  Redis: RedisMock,
}));
