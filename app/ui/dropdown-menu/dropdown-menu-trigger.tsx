import { Trigger } from '@radix-ui/react-dropdown-menu';
import type { DropdownMenuTriggerProps as RadixDropdownMenuTriggerProps } from '@radix-ui/react-dropdown-menu';
import type { FC, PropsWithChildren } from 'react';
import { Button } from '../button/button';

export type DropdownTriggerProps = {
  iconTitle?: string;
} & RadixDropdownMenuTriggerProps
& PropsWithChildren;

export const DropdownMenuTrigger: FC<DropdownTriggerProps> = ({
  children,
  iconTitle,
  ...radixDropdownMenuTriggerProps
}) => {
  return (
    <Trigger {...radixDropdownMenuTriggerProps} asChild>
      {children
        ? (
            children
          )
        : (
            <Button
              icon="horizontalDots"
              type="button"
              color="secondary"
              iconTitle={iconTitle}
              className="cursor-pointer transition-colors! ease-in data-[state=open]:bg-pca-grey-100! dark:data-[state=open]:bg-pca-grey-800!"
            />
          )}
    </Trigger>
  );
};
