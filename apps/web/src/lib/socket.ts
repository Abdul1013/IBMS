import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

const API_URL = import.meta.env['VITE_API_URL'] as string | undefined;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = useAuthStore.getState().accessToken ?? '';
    const opts = { withCredentials: true, auth: { token } };
    socket = API_URL ? io(API_URL, opts) : io(opts);
  }
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};
