import rateLimit from 'express-rate-limit';

const skipDuringLoadTest = (): boolean => process.env['DISABLE_RATE_LIMITS'] === 'true';

// Global API limiter — broad protection for all /api/* routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDuringLoadTest,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many requests. Slow down.' },
  },
});

// Auth endpoints — strict to deter brute force / credential stuffing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDuringLoadTest,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' },
  },
});

// Public read endpoints (announcement feed, categories)
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDuringLoadTest,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests.' } },
});

// Write-heavy staff/admin posting endpoints
export const postingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipDuringLoadTest,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Posting too fast. Slow down.' },
  },
});
