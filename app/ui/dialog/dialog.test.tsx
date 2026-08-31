import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { Dialog } from './dialog';
import { DialogContent } from './dialog-content';
import type { DialogContentProps } from './dialog-content';
import { DialogContentInner } from './dialog-content-inner';
import type { DialogContentInnerProps } from './dialog-content-inner';
import { DialogTopbar } from './dialog-topbar';
import type { DialogTopbarProps } from './dialog-topbar';

function renderDialog(
  { contentProps, innerProps, defaultOpen }:
  {
    contentProps?: DialogContentProps;
    innerProps?: DialogContentInnerProps;
    defaultOpen?: boolean;
  } = {},
) {
  return render(
    <Dialog defaultOpen={defaultOpen}>
      <BaseDialog.Trigger>Open dialog</BaseDialog.Trigger>
      <DialogContent {...contentProps}>
        <DialogContentInner {...innerProps}>
          <BaseDialog.Title>Delete document</BaseDialog.Title>
          <BaseDialog.Description>
            This action cannot be undone.
          </BaseDialog.Description>
          {innerProps?.children}
        </DialogContentInner>
      </DialogContent>
    </Dialog>,
  );
}

function renderTopbar(topbarProps: DialogTopbarProps) {
  return render(
    <Dialog defaultOpen>
      <DialogContent>
        <DialogContentInner topArea={<DialogTopbar {...topbarProps} />}>
          Body content
        </DialogContentInner>
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
  test('applies the class of the requested size', () => {
    renderDialog({ defaultOpen: true, contentProps: { size: 'large' } });

    expect(screen.getByRole('dialog')).toHaveClass('max-w-3xl');
  });

  test('applies the full height class when isFullHeight is set', () => {
    renderDialog({ defaultOpen: true, contentProps: { isFullHeight: true } });

    expect(screen.getByRole('dialog')).toHaveClass('h-130');
  });

  test('does not apply the full height class by default', () => {
    renderDialog({ defaultOpen: true });

    expect(screen.getByRole('dialog')).not.toHaveClass('h-130');
  });

  test('transitions the scale of the popup, not its transform', () => {
    renderDialog({ defaultOpen: true });

    // Tailwind sets the standalone `scale` property, so transitioning
    // `transform` would make the popup snap instead of animate.
    expect(screen.getByRole('dialog'))
      .toHaveClass('transition-[scale,opacity]');
  });

  test('merges a custom class name onto the popup', () => {
    renderDialog({ defaultOpen: true, contentProps: { className: 'w-96' } });

    expect(screen.getByRole('dialog')).toHaveClass('w-96');
  });

  test('matches the snapshot with every area filled', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent size="large" isFullHeight>
          <DialogContentInner
            topArea={<DialogTopbar title="Settings" onBack={vi.fn()} />}
            sideArea={<nav>Navigation</nav>}
            footerArea={<button type="button">Save</button>}
          >
            <p>Body content</p>
          </DialogContentInner>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole('dialog')).toMatchSnapshot();
  });
});

describe('DialogContentInner', () => {
  test('renders its children inside the dialog', () => {
    renderDialog({
      defaultOpen: true,
      innerProps: { children: <p>Body content</p> },
    });

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('renders the top area', () => {
    renderDialog({
      defaultOpen: true,
      innerProps: { topArea: <span>Top area content</span> },
    });

    expect(screen.getByText('Top area content')).toBeInTheDocument();
  });

  test('renders the footer area', () => {
    renderDialog({
      defaultOpen: true,
      innerProps: { footerArea: <button type="button">Save</button> },
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('does not render a side area by default', () => {
    renderDialog({ defaultOpen: true });

    expect(screen.queryByText('Side content')).not.toBeInTheDocument();
  });

  test('renders the side area', () => {
    renderDialog({
      defaultOpen: true,
      innerProps: { sideArea: <span>Side content</span> },
    });

    expect(screen.getByText('Side content')).toBeInTheDocument();
  });

  test('keeps the footer beside the side area, not underneath it', () => {
    renderDialog({
      defaultOpen: true,
      innerProps: {
        sideArea: <span>Side content</span>,
        footerArea: <button type="button">Save</button>,
      },
    });

    const side = screen.getByText('Side content').parentElement;
    const footer = screen.getByRole('button', { name: 'Save' }).parentElement;

    expect(side).not.toContainElement(footer);
    expect(side?.parentElement).toContainElement(footer);
  });

  test('pads the content, the side area and the footer the same', () => {
    renderDialog({
      defaultOpen: true,
      innerProps: {
        children: <p>Body content</p>,
        sideArea: <span>Side content</span>,
        footerArea: <button type="button">Save</button>,
      },
    });

    expect(screen.getByText('Body content').parentElement).toHaveClass('p-4');
    expect(screen.getByText('Side content').parentElement).toHaveClass('p-4');
    expect(screen.getByRole('button', { name: 'Save' }).parentElement)
      .toHaveClass('p-4');
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
