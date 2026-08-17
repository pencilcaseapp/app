import { Drawer } from '@base-ui/react/drawer';
import type { DrawerRootProps } from '@base-ui/react';
import type { FC } from 'react';

export type DrawerProps = DrawerRootProps;

export const Sheet: FC<DrawerProps> = ({ children, ...rest }) => {
  return (
    <Drawer.Root {...rest}>
      {children}
    </Drawer.Root>
  );
};
