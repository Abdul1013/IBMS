import type { Server as SocketServer } from 'socket.io';

let _io: SocketServer | null = null;

export const setIo = (io: SocketServer): void => {
  _io = io;
};

export const emitToRooms = (rooms: string[], event: string, payload: unknown): void => {
  if (!_io) {
    console.warn('Socket.IO not initialised — skipping emit');
    return;
  }
  rooms.forEach(room => _io!.to(room).emit(event, payload));
};
