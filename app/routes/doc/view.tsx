import { useEffect } from 'react';
import { useSocket } from '~/hooks/use-socket';

export default function View() {
  const socket = useSocket();

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });
  });

  return (
    <h1>Doc 123</h1>
  );
}
