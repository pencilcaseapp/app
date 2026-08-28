import { Toast as BaseToast } from '@base-ui/react/toast';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from './toast-provider';

const Emitter = () => {
  const { add } = BaseToast.useToastManager();

  return (
    <button type="button" onClick={() => add({ type: 'info', title: 'Saved' })}>
      emit
    </button>
  );
};

const renderProvider = () => {
  const user = userEvent.setup();

  render(
    <ToastProvider>
      <Emitter />
    </ToastProvider>,
  );

  return {
    user,
    emit: () => user.click(screen.getByRole('button', { name: 'emit' })),
  };
};

const indexOf = (toast: HTMLElement) =>
  toast.style.getPropertyValue('--toast-index');

describe('ToastProvider', () => {
  it('should render no toast until one is emitted', () => {
    renderProvider();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render an emitted toast', async () => {
    const { emit } = renderProvider();

    await emit();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('should stack the newest toast in front', async () => {
    const { emit } = renderProvider();

    await emit();
    await emit();

    const [newest, oldest] = screen.getAllByRole('dialog');
    expect(indexOf(newest)).toBe('0');
    expect(indexOf(oldest)).toBe('1');
  });

  it('should hide the content of the toasts behind the frontmost one', async () => {
    const { emit } = renderProvider();

    await emit();
    await emit();

    const [newest, oldest] = screen.getAllByRole('dialog');
    expect(newest.querySelector('[data-behind]')).toBeNull();
    expect(oldest.querySelector('[data-behind]')).toBeInTheDocument();
  });
});
