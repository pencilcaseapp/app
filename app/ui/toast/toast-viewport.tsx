import { Toast as BaseToast } from '@base-ui/react/toast';
import type { FC } from 'react';
import { Toast } from './toast';

/**
 * Anchors the toast stack to the top of the screen. The toasts inside are
 * positioned absolutely, so the viewport only takes the height of the frontmost
 * one — just enough to be the hover target that expands the stack.
 */
export const ToastViewport: FC = () => {
  const { toasts } = BaseToast.useToastManager();

  return (
    <BaseToast.Portal>
      <BaseToast.Viewport className="fixed top-4 left-1/2 z-50 h-[var(--toast-frontmost-height)] w-full lg:w-md max-w-[calc(100vw-1rem)] -translate-x-1/2 outline-hidden">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} />
        ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
};
