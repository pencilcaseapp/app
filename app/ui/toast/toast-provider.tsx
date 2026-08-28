import { Toast as BaseToast } from '@base-ui/react/toast';
import type { FC, PropsWithChildren } from 'react';
import { ToastViewport } from './toast-viewport';

/**
 * Wraps the app so anything below it can emit toasts with base UI's
 * `Toast.useToastManager()`, and renders the viewport they land in.
 */
export const ToastProvider: FC<PropsWithChildren> = ({ children }) => (
  <BaseToast.Provider>
    {children}
    <ToastViewport />
  </BaseToast.Provider>
);
