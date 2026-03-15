import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import authRoutes from './modules/auth/auth.routes';
import { announcementRouter, categoryRouter } from './modules/announcements/announcement.routes';
import commentRoutes from './modules/comments/comment.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import adminRoutes from './modules/admin/admin.routes';

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // allow Cloudinary images to load
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  })
);

// CORS
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Gzip compression
app.use(compression());

// Trust proxy (required for correct IP detection behind Nginx/load-balancer)
app.set('trust proxy', 1);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Request correlation ID
app.use((_req, res, next) => {
  res.setHeader('X-Request-Id', randomUUID());
  next();
});

// NoSQL injection — strip $ / dot keys from body AND query params
const stripOperators = (obj: unknown): void => {
  if (typeof obj !== 'object' || obj === null) return;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete (obj as Record<string, unknown>)[key];
    } else {
      stripOperators((obj as Record<string, unknown>)[key]);
    }
  }
};
app.use((req, _res, next) => {
  stripOperators(req.body);
  stripOperators(req.query);
  next();
});

// Global rate limiter (before all routes)
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: env.NODE_ENV,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/announcements', announcementRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/comments', commentRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 catch-all
app.use((_req, res) => {
  res
    .status(404)
    .json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// Global error handler — must be last
app.use(errorHandler);

export default app;
