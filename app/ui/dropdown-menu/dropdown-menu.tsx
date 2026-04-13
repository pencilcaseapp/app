import { Root } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuProps as RadixDropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { FC, PropsWithChildren } from 'react';

export type DropdownMenuProps = RadixDropdownMenuProps & PropsWithChildren;

export const DropdownMenu: FC<DropdownMenuProps> = ({
  children,
  ...radixDropdownMenuProps
}) => {
  return <Root {...radixDropdownMenuProps}>{children}</Root>;
};
