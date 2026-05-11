import { Outlet } from 'react-router';
import { SocketClientProvider } from '~/contexts/socket-client';

export const handle = {
  bodyClass: 'w-full bg-pca-white dark:bg-pca-grey-900',
};

export default function LayoutEditor() {
  return (
    <SocketClientProvider>
      <Outlet />
    </SocketClientProvider>
  );
};
