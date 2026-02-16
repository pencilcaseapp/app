import { io } from 'socket.io-client';
import { useEffect, useMemo, useState } from 'react';

export function useSocket(input: {
  url?: string;
  docId: string;
}) {
  const { url, docId } = input;
  const [users, setUsers] = useState<string[]>([]);
  // eslint-disable-next-line react-hooks/purity
  const userName = useMemo(() => `User #${Math.floor(Math.random() * 1000)}`, []);
  const socket = useMemo(() => io(url, {
    autoConnect: false,
    auth: {
      docId,
      userName,
    },
  }), [url, docId, userName]);

  useEffect(() => {
    socket.connect();

    socket.on('users.updated', (users) => {
      setUsers(users.map((u: { id: string; userName: string }) => u.id !== socket.id ? u.userName : undefined).filter(Boolean));
    });

    return () => {
      socket.off('connect');
      socket.disconnect();
    };
  }, [socket]);

  return { users };
}
