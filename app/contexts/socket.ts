import { createContext } from 'react';
import { Socket } from 'socket.io-client';

export const ContextSocket = createContext<Socket | null>(null);
