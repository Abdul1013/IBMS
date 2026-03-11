import type { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '@ibms/types';
import { env } from '../config/env';

export const registerRoomHandlers = (socket: Socket): void => {
  // All connected clients join the global room automatically
  void socket.join('global');

  // Authenticate socket and join personal room for notifications
  const token = socket.handshake.auth['token'] as string | undefined;
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      void socket.join(`user:${payload.userId}`);
    } catch {
      // unauthenticated — global room only
    }
  }

  socket.on('join:room', ({ room }: { room: string }) => {
    if (/^(category|dept|announcement):[a-z0-9-]+$/i.test(room)) void socket.join(room);
  });

  socket.on('leave:room', ({ room }: { room: string }) => void socket.leave(room));

  socket.on('disconnect', () => {
    console.warn(`Socket disconnected: ${socket.id}`);
  });
};
