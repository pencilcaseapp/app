import { Toast as BaseToast } from '@base-ui/react/toast';
import type { FC } from 'react';
import { Toast } from './toast';

/**
 * Anchors the toast stack to the top of the screen. The toasts inside are
 * positioned absolutely, so the viewport only takes the height of the frontmost
 * one — just enough to be the hover target that expands the stack.
 *
 * Toasts are the topmost layer: `z-70` keeps them above the dialog and drawer
 * backdrops (`z-50`) and the tooltips (`z-60`), which would otherwise dim or
 * cover a toast emitted while a dialog is open.
 */
export const ToastViewport: FC = () => {
  const { toasts } = BaseToast.useToastManager();

  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className="fixed top-4 left-1/2 z-70 h-(--toast-frontmost-height) w-full lg:w-md max-w-[calc(100vw-1rem)] -translate-x-1/2 outline-hidden">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
};
