import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    hookTimeout: 60000,
    testTimeout: 30000,
    globalSetup: ['./vitest.globalSetup.ts'],
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      REDIS_URL: 'redis://mock',
      JWT_SECRET: 'test_jwt_secret_minimum_32_characters_long',
      JWT_REFRESH_SECRET: 'test_refresh_secret_minimum_32_chars_x',
      CLOUDINARY_URL: 'cloudinary://test:test@testcloud',
      RESEND_API_KEY: 're_test_key_placeholder',
      CLIENT_URL: 'http://localhost:3000',
    },
  },
});
