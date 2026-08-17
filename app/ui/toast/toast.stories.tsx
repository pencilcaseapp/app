import { Toast as BaseToast } from '@base-ui/react/toast';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { Toast, ToastProvider, type ToastVariant } from './toast';

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

const staticToast = (variant: ToastVariant) => ({
  id: variant,
  type: variant,
  title: 'Toast messages are helpful...',
});

export const ToastExample: Story = {
  render: () => (
    <BaseToast.Provider>
      <div className="flex flex-col gap-3">
        {variants.map(variant => (
          <Toast key={variant} toast={staticToast(variant)} />
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
 * Emitted toasts stack at the bottom of the screen and dismiss themselves
 * after five seconds.
 */
export const ToastEmitted: Story = {
  render: () => (
    <ToastProvider>
      <ToastTriggers />
    </ToastProvider>
  ),
};
