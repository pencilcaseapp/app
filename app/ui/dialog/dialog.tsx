import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import type { DialogRootProps } from '@base-ui/react';
import type { FC } from 'react';

export type DialogProps = DialogRootProps;

export const Dialog: FC<DialogProps> = ({ children, ...rest }) => {
  return (
    <BaseDialog.Root {...rest}>
      {children}
    </BaseDialog.Root>
  );
};
