import { getConfig } from '~/config';
import { Outlet } from 'react-router';
import { SocketProvider } from '~/components/socket-provider';
import type { Route } from './+types/editor';

export function loader() {
  const config = getConfig();

  return {
    socketUrl: config.socket.url,
  };
}

export default function LayoutEditor({ loaderData }: Route.ComponentProps) {
  return (
    <SocketProvider url={loaderData.socketUrl}>
      <Outlet />
    </SocketProvider>
  );
};
