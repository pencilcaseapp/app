import { Outlet } from 'react-router';
import { SocketClientProvider } from '~/contexts/socket-client';
import { getConfig } from '~/config';
import type { Route } from './+types/editor';

export async function loader() {
  const config = getConfig();

  return {
    wsUrl: config.ws.url,
  };
}

export default function LayoutEditor({ loaderData }: Route.ComponentProps) {
  return (
    <SocketClientProvider wsUrl={loaderData.wsUrl}>
      <Outlet />
    </SocketClientProvider>
  );
};
