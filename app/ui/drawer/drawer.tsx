import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import type { DrawerRootProps } from '@base-ui/react';
import type { FC } from 'react';

export type DrawerProps = DrawerRootProps;

export const Drawer: FC<DrawerProps> = ({ children, ...rest }) => {
  return (
    <BaseDrawer.Root {...rest}>
      {children}
    </BaseDrawer.Root>
  );
};
