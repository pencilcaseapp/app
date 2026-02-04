import { Outlet } from 'react-router';
import { SocketProvider } from '~/components/socket-provider/socket-provider';

export default function LayoutEditor() {
  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
};
