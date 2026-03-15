import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    hookTimeout: 30000,
    testTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      PORT: '5001',
      MONGO_URI: 'mongodb://localhost:27017/ibms_test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test_jwt_secret_minimum_32_characters_long',
      JWT_REFRESH_SECRET: 'test_refresh_secret_minimum_32_chars_x',
      CLOUDINARY_URL: 'cloudinary://test:test@testcloud',
      RESEND_API_KEY: 're_test_key_placeholder',
      CLIENT_URL: 'http://localhost:3000',
    },
  },
});
