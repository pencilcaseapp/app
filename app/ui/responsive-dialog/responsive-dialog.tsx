import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Drawer } from '@base-ui/react/drawer';
import type {
  DialogCloseProps,
  DialogDescriptionProps,
  DialogTitleProps,
  DialogTriggerProps,
} from '@base-ui/react';
import { createContext, use } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { Dialog } from '~/ui/dialog/dialog';
import { Sheet } from '~/ui/drawer/drawer';

export type ResponsiveDialogProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
} & PropsWithChildren;

const IsDrawerContext = createContext(false);

export const useIsDrawer = () => use(IsDrawerContext);

/*
 * Renders the bottom sheet drawer below Tailwind's `sm` breakpoint and the
 * centered dialog everywhere else. The chosen variant is shared through
 * context, so the trigger, close, title and description parts below and
 * `ResponsiveDialogContent` always match the root.
 */
export const ResponsiveDialog: FC<ResponsiveDialogProps> = (
  { children, ...rest },
) => {
  const isMobile = useIsMobile();
  const Root = isMobile ? Sheet : Dialog;

  return (
    <IsDrawerContext value={isMobile}>
      <Root {...rest}>{children}</Root>
    </IsDrawerContext>
  );
};

export type ResponsiveDialogTriggerProps
  = Omit<DialogTriggerProps, 'handle' | 'payload'>;

export const ResponsiveDialogTrigger: FC<ResponsiveDialogTriggerProps> = (
  props,
) => {
  return useIsDrawer()
    ? <Drawer.Trigger {...props} />
    : <BaseDialog.Trigger {...props} />;
};

export type ResponsiveDialogCloseProps = DialogCloseProps;

export const ResponsiveDialogClose: FC<ResponsiveDialogCloseProps> = (
  props,
) => {
  return useIsDrawer()
    ? <Drawer.Close {...props} />
    : <BaseDialog.Close {...props} />;
};

export type ResponsiveDialogTitleProps = DialogTitleProps;

export const ResponsiveDialogTitle: FC<ResponsiveDialogTitleProps> = (
  props,
) => {
  return useIsDrawer()
    ? <Drawer.Title {...props} />
    : <BaseDialog.Title {...props} />;
};

export type ResponsiveDialogDescriptionProps = DialogDescriptionProps;

export const ResponsiveDialogDescription: FC<
  ResponsiveDialogDescriptionProps
> = (props) => {
  return useIsDrawer()
    ? <Drawer.Description {...props} />
    : <BaseDialog.Description {...props} />;
};
