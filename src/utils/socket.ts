import { Server } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:2000/',
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getSocket = (): Server => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};
