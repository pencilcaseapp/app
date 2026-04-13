import { Portal } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuPortalProps as RadixDropdownMenuPortalProps } from '@radix-ui/react-dropdown-menu';
import type { FC, PropsWithChildren } from 'react';

export type DropdownMenuPortalProps = RadixDropdownMenuPortalProps
  & PropsWithChildren;

export const DropdownMenuPortal: FC<DropdownMenuPortalProps> = ({
  children,
  ...radixDropdownMenuPortalProps
}) => {
  return <Portal {...radixDropdownMenuPortalProps}>{children}</Portal>;
};
