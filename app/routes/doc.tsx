import { useEffect } from 'react';
import { useSocket } from '~/hooks/use-socket';
import type { Route } from './+types/doc';

export default function ({ params }: Route.ComponentProps) {
  const socket = useSocket();

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });
  });

  return (
    <>
      <h1>
        Doc
        {params.id}
      </h1>
    </>
  );
}
