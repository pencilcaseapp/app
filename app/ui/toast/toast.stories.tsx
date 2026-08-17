import { Toast as BaseToast } from '@base-ui/react/toast';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Toast, type ToastVariant } from './toast';
import { ToastProvider } from './toast-provider';

/**
 * 🍞 The `Toast` component is used to give the user a short feedback message.
 *
 * Wrap the app in `ToastProvider` and emit toasts with base UI's
 * `Toast.useToastManager()`, passing the variant as the toast `type`.
 */
const meta: Meta<typeof Toast> = {
  title: 'Feedback/Toast',
  component: Toast,
};

export default meta;
type Story = StoryObj<typeof Toast>;

const variants: ToastVariant[] = ['info', 'success', 'warning', 'danger'];

export const ToastExample: Story = {
  render: () => (
    <BaseToast.Provider>
      <div className="flex flex-col gap-3">
        {variants.map(variant => (
          <div key={variant} className="relative h-12 w-[285px]">
            <Toast
              toast={{
                id: variant,
                type: variant,
                title: 'Toast messages are helpful...',
              }}
            />
          </div>
        ))}
      </div>
    </BaseToast.Provider>
  ),
};

const ToastTriggers = () => {
  const { add } = BaseToast.useToastManager();

  return (
    <div className="flex flex-wrap gap-3">
      {variants.map(variant => (
        <Button
          key={variant}
          onClick={() => add({
            type: variant,
            title: `Toast messages are helpful... (${variant})`,
          })}
        >
          {variant}
        </Button>
      ))}
    </div>
  );
};

/**
 * Emitted toasts stack at the bottom of the screen and dismiss themselves after
 * five seconds. Hover the stack to lay it out, or swipe a toast down or to the
 * right to dismiss it by hand.
 */
export const ToastEmitted: Story = {
  render: () => (
    <ToastProvider>
      <ToastTriggers />
    </ToastProvider>
  ),
};
