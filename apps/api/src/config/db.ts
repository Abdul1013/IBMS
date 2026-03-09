import mongoose from 'mongoose';
import { env } from './env';
import logger from './logger';

export const connectDB = async (): Promise<void> => {
  mongoose.connection.on('disconnected', () => {
    logger.warn('[db] MongoDB disconnected');
  });
  mongoose.connection.on('reconnected', () => {
    logger.info('Database connected');
  });

  try {
    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      connectTimeoutMS: 10_000,
    });
    logger.info('[db] MongoDB connected');
  } catch (error) {
    console.error('[db] MongoDB connection failed:', error);
    process.exit(1);
  }
};
