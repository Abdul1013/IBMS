import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const API_URL = (import.meta.env['VITE_API_URL'] as string) ?? '';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = useAuthStore.getState().accessToken ?? '';
    socket = io(API_URL, {
      withCredentials: true,
      auth: { token },
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
