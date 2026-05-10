import { Outlet } from 'react-router';
import { SocketClientProvider } from '~/contexts/socket-client';
import { LayoutBase } from './base';

export default function LayoutEditor() {
  return (
    <LayoutBase bodyClassName="w-full bg-pca-white dark:bg-pca-grey-900">
      <SocketClientProvider>
        <Outlet />
      </SocketClientProvider>
    </LayoutBase>
  );
};
