import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '../lib/socket';
import type { Socket } from 'socket.io-client';

export const useSocket = (): Socket => {
  const socket = getSocket();

  useEffect(() => {
    if (!socket.connected) socket.connect();
    return () => {
      disconnectSocket();
    };
  }, [socket]);

  return socket;
};

export const useSocketRoom = (room: string): void => {
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit('join:room', { room });
    return () => {
      socket.emit('leave:room', { room });
    };
  }, [room]);
};
