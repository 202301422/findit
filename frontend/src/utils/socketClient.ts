import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5000';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      withCredentials: true,
      auth: {
        token: localStorage.getItem('accessToken') ?? '',
      },
    });
  }

  return socketInstance;
};

export const setSocketAuthToken = (token: string | null) => {
  const socket = getSocket();
  socket.auth = {
    token: token ?? '',
  };
};

export const connectSocket = () => {
  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
};