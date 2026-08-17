import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer } from '@base-ui/react/drawer';
import { Sheet } from './drawer';
import { DrawerContent } from './drawer-content';
import type { DrawerContentProps } from './drawer-content';

function renderDrawer(
  { contentProps, defaultOpen }:
  { contentProps?: DrawerContentProps; defaultOpen?: boolean } = {},
) {
  return render(
    <Sheet defaultOpen={defaultOpen}>
      <Drawer.Trigger>Open drawer</Drawer.Trigger>
      <DrawerContent {...contentProps}>
        <Drawer.Title>Delete document</Drawer.Title>
        <Drawer.Description>This action cannot be undone.</Drawer.Description>
        {contentProps?.children}
      </DrawerContent>
    </Sheet>,
  );
}

describe('Sheet', () => {
  test('renders the trigger', () => {
    renderDrawer();

    expect(
      screen.getByRole('button', { name: 'Open drawer' }),
    ).toBeInTheDocument();
  });

  test('does not show the drawer content by default', () => {
    renderDrawer();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete document')).not.toBeInTheDocument();
  });

  test('opens the drawer on trigger click', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(screen.getByRole('button', { name: 'Open drawer' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Delete document')).toBeInTheDocument();
    expect(
      screen.getByText('This action cannot be undone.'),
    ).toBeInTheDocument();
  });

  test('renders when open by default', () => {
    renderDrawer({ defaultOpen: true });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('closes the drawer on Escape', async () => {
    const user = userEvent.setup();
    renderDrawer({ defaultOpen: true });

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
        <Sheet
          open={open}
          onOpenChange={(nextOpen) => {
            onOpenChange(nextOpen);
            setOpen(nextOpen);
          }}
        >
          <Drawer.Trigger>Open drawer</Drawer.Trigger>
          <DrawerContent>
            <Drawer.Title>Settings</Drawer.Title>
            <Drawer.Close>Close</Drawer.Close>
          </DrawerContent>
        </Sheet>
      );
    }

    render(<Controlled />);

    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('DrawerContent', () => {
  test('renders its children inside the drawer', () => {
    renderDrawer({
      defaultOpen: true,
      contentProps: {
        children: <p>Body content</p>,
      },
    });

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('renders the top area', () => {
    renderDrawer({
      defaultOpen: true,
      contentProps: {
        topArea: <span>Top area content</span>,
      },
    });

    expect(screen.getByText('Top area content')).toBeInTheDocument();
  });

  test('renders the footer area', () => {
    renderDrawer({
      defaultOpen: true,
      contentProps: {
        footerArea: <button type="button">Save</button>,
      },
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('applies the full height class when isFullHeight is set', () => {
    renderDrawer({ defaultOpen: true, contentProps: { isFullHeight: true } });

    expect(screen.getByRole('dialog')).toHaveClass(
      'min-h-[calc(95dvh+var(--bleed))]',
    );
  });

  test('does not apply the full height class by default', () => {
    renderDrawer({ defaultOpen: true });

    expect(screen.getByRole('dialog')).not.toHaveClass(
      'min-h-[calc(95dvh+var(--bleed))]',
    );
  });

  test('reserves footer height based on reservedFooterHeight', () => {
    renderDrawer({
      defaultOpen: true,
      contentProps: {
        reservedFooterHeight: 96,
        footerArea: <button type="button">Save</button>,
      },
    });

    expect(screen.getByRole('dialog')).toHaveClass(
      '[--footer-reserved-height:calc(96px+var(--bleed))]',
    );
  });
});
