/* eslint-disable no-console */
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { setIo } from './sockets/emitter';
import { registerRoomHandlers } from './sockets/roomHandler';
import { startArchiverJob } from './jobs/archiver';

// Catch unhandled errors before they silently crash the process
process.on('uncaughtException', err => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});
process.on('unhandledRejection', reason => {
  console.error('[unhandledRejection]', reason);
  process.exit(1);
});

const httpServer = http.createServer(app);

export const io = new SocketServer(httpServer, {
  cors: { origin: env.CLIENT_URL, credentials: true },
  maxHttpBufferSize: 1e6, // 1 MB max message size
  pingTimeout: 60_000,
  pingInterval: 25_000,
  transports: ['websocket', 'polling'],
});

setIo(io);

io.on('connection', socket => {
  if (env.NODE_ENV === 'development') {
    console.log(`[socket] connected: ${socket.id}`);
  }
  registerRoomHandlers(socket);

  socket.on('disconnect', reason => {
    if (env.NODE_ENV === 'development') {
      console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    }
  });
});

const start = async () => {
  await connectDB();
  startArchiverJob();
  const port = Number(env.PORT);
  httpServer.listen(port, () => {
    console.log(`[server] API running on port ${port} (${env.NODE_ENV})`);
  });
};

// Graceful shutdown — drain in-flight requests before exiting
const shutdown = (signal: string) => {
  console.log(`[server] ${signal} received — shutting down gracefully`);
  httpServer.close(() => {
    console.log('[server] HTTP server closed');
    process.exit(0);
  });
  // Force exit if server is still open after 10s
  setTimeout(() => {
    console.error('[server] Forced exit after timeout');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
