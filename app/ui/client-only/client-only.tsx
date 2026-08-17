import React from 'react';
import { useIsClient } from '@uidotdev/usehooks';

export type ClientOnlyProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const ClientOnly: React.FC<ClientOnlyProps> = ({
  children,
  fallback = null,
}) => {
  const isClient = useIsClient();

  if (typeof process !== 'undefined' && process.env.TEST === 'true') {
    return <>{children}</>;
  }

  // Render children if on client side, otherwise return fallback
  return isClient ? <>{children}</> : <>{fallback}</>;
};
