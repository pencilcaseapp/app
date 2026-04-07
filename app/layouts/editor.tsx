import { Outlet } from 'react-router';
import { SocketClientProvider } from '~/contexts/socket-client';

export default function LayoutEditor() {
  return (
    <SocketClientProvider>
      <Outlet />
    </SocketClientProvider>
  );
};
