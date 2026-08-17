import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Dialog } from './dialog';
import { DialogContent } from './dialog-content';
import type { DialogContentProps } from './dialog-content';
import { DialogTopbar } from './dialog-topbar';
import type { DialogTopbarProps } from './dialog-topbar';

function renderDialog(
  { contentProps, defaultOpen }:
  { contentProps?: DialogContentProps; defaultOpen?: boolean } = {},
) {
  return render(
    <Dialog defaultOpen={defaultOpen}>
      <BaseDialog.Trigger>Open dialog</BaseDialog.Trigger>
      <DialogContent {...contentProps}>
        <BaseDialog.Title>Delete document</BaseDialog.Title>
        <BaseDialog.Description>
          This action cannot be undone.
        </BaseDialog.Description>
        {contentProps?.children}
      </DialogContent>
    </Dialog>,
  );
}

function renderTopbar(topbarProps: DialogTopbarProps) {
  return render(
    <Dialog defaultOpen>
      <DialogContent topArea={<DialogTopbar {...topbarProps} />}>
        Body content
      </DialogContent>
    </Dialog>,
  );
}

describe('Dialog', () => {
  test('renders the trigger', () => {
    renderDialog();

    expect(
      screen.getByRole('button', { name: 'Open dialog' }),
    ).toBeInTheDocument();
  });

  test('does not show the dialog content by default', () => {
    renderDialog();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete document')).not.toBeInTheDocument();
  });

  test('opens the dialog on trigger click', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete document')).toBeInTheDocument();
    expect(
      screen.getByText('This action cannot be undone.'),
    ).toBeInTheDocument();
  });

  test('renders when open by default', () => {
    renderDialog({ defaultOpen: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes the dialog on Escape', async () => {
    const user = userEvent.setup();
    renderDialog({ defaultOpen: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('is fully controllable via open and onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(false);

      return (
        <Dialog
          open={open}
          onOpenChange={(nextOpen) => {
            onOpenChange(nextOpen);
            setOpen(nextOpen);
          }}
        >
          <BaseDialog.Trigger>Open dialog</BaseDialog.Trigger>
          <DialogContent>
            <BaseDialog.Title>Settings</BaseDialog.Title>
            <BaseDialog.Close>Close</BaseDialog.Close>
          </DialogContent>
        </Dialog>
      );
    }

    render(<Controlled />);

    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('DialogContent', () => {
  test('renders its children inside the dialog', () => {
    renderDialog({
      defaultOpen: true,
      contentProps: { children: <p>Body content</p> },
    });

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('renders the top area', () => {
    renderDialog({
      defaultOpen: true,
      contentProps: { topArea: <span>Top area content</span> },
    });

    expect(screen.getByText('Top area content')).toBeInTheDocument();
  });

  test('renders the footer area', () => {
    renderDialog({
      defaultOpen: true,
      contentProps: { footerArea: <button type="button">Save</button> },
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('applies the medium size by default', () => {
    renderDialog({ defaultOpen: true });

    expect(screen.getByRole('dialog')).toHaveClass('max-w-lg');
  });

  test('applies the class of the requested size', () => {
    renderDialog({ defaultOpen: true, contentProps: { size: 'large' } });

    expect(screen.getByRole('dialog')).toHaveClass('max-w-3xl');
  });

  test('applies the full height class when isFullHeight is set', () => {
    renderDialog({ defaultOpen: true, contentProps: { isFullHeight: true } });

    expect(screen.getByRole('dialog')).toHaveClass('h-[32.5rem]');
  });

  test('does not apply the full height class by default', () => {
    renderDialog({ defaultOpen: true });

    expect(screen.getByRole('dialog')).not.toHaveClass('h-[32.5rem]');
  });

  test('merges a custom class name onto the popup', () => {
    renderDialog({ defaultOpen: true, contentProps: { className: 'w-96' } });

    expect(screen.getByRole('dialog')).toHaveClass('w-96');
  });
});

describe('DialogTopbar', () => {
  test('renders the title as the accessible name of the dialog', () => {
    renderTopbar({ title: 'Settings' });

    expect(
      screen.getByRole('dialog', { name: 'Settings' }),
    ).toBeInTheDocument();
  });

  test('closes the dialog with the close trigger', async () => {
    const user = userEvent.setup();
    renderTopbar({ title: 'Settings' });

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('labels the close trigger with closeLabel', () => {
    renderTopbar({ title: 'Settings', closeLabel: 'Dismiss' });

    expect(
      screen.getByRole('button', { name: 'Dismiss' }),
    ).toBeInTheDocument();
  });

  test('does not render a back button by default', () => {
    renderTopbar({ title: 'Settings' });

    expect(
      screen.queryByRole('button', { name: 'Back' }),
    ).not.toBeInTheDocument();
  });

  test('calls onBack when the back button is clicked', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    renderTopbar({ title: 'Account', onBack });

    await user.click(screen.getByRole('button', { name: 'Back' }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('labels the back button with backLabel', () => {
    renderTopbar({ title: 'Account', onBack: vi.fn(), backLabel: 'Go back' });

    expect(
      screen.getByRole('button', { name: 'Go back' }),
    ).toBeInTheDocument();
  });

  test('renders a border when hasBorder is set', () => {
    renderTopbar({ title: 'Settings', hasBorder: true });

    expect(screen.getByRole('heading', { name: 'Settings' }).parentElement)
      .toHaveClass('border-b');
  });
});
