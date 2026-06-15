import { Root } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuProps as RadixDropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import type { FC, PropsWithChildren } from 'react';

export type DropdownMenuProps = RadixDropdownMenuProps & PropsWithChildren;

export const DropdownMenu: FC<DropdownMenuProps> = ({
  children,
  modal = false,
  ...radixDropdownMenuProps
}) => {
  return <Root modal={modal} {...radixDropdownMenuProps}>{children}</Root>;
};
