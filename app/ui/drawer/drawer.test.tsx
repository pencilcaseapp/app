import { useState } from 'react';
import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { Drawer } from './drawer';
import { DrawerContent } from './drawer-content';
import type { DrawerContentProps } from './drawer-content';
import { DrawerContentInner } from './drawer-content-inner';
import type { DrawerContentInnerProps } from './drawer-content-inner';

function renderDrawer(
  { contentProps, innerProps, defaultOpen }:
  {
    contentProps?: DrawerContentProps;
    innerProps?: DrawerContentInnerProps;
    defaultOpen?: boolean;
  } = {},
) {
  return render(
    <Drawer defaultOpen={defaultOpen}>
      <BaseDrawer.Trigger>Open drawer</BaseDrawer.Trigger>
      <DrawerContent {...contentProps}>
        <DrawerContentInner {...innerProps}>
          <BaseDrawer.Title>Delete document</BaseDrawer.Title>
          <BaseDrawer.Description>
            This action cannot be undone.
          </BaseDrawer.Description>
          {innerProps?.children}
        </DrawerContentInner>
      </DrawerContent>
    </Drawer>,
  );
}

describe('Drawer', () => {
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
        <Drawer
          open={open}
          onOpenChange={(nextOpen) => {
            onOpenChange(nextOpen);
            setOpen(nextOpen);
          }}
        >
          <BaseDrawer.Trigger>Open drawer</BaseDrawer.Trigger>
          <DrawerContent>
            <BaseDrawer.Title>Settings</BaseDrawer.Title>
            <BaseDrawer.Close>Close</BaseDrawer.Close>
          </DrawerContent>
        </Drawer>
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
  test('applies the full height class when isFullHeight is set', () => {
    renderDrawer({ defaultOpen: true, contentProps: { isFullHeight: true } });

    expect(screen.getByRole('dialog')).toHaveClass(
      'min-h-[calc(var(--drawer-max-height)+var(--bleed))]',
    );
  });

  test('does not apply the full height class by default', () => {
    renderDrawer({ defaultOpen: true });

    expect(screen.getByRole('dialog')).not.toHaveClass(
      'min-h-[calc(var(--drawer-max-height)+var(--bleed))]',
    );
  });

  test('defaults the max height to 95dvh', () => {
    renderDrawer({ defaultOpen: true });

    expect(
      screen.getByRole('dialog').style
        .getPropertyValue('--drawer-max-height'),
    ).toBe('95dvh');
  });

  test('applies a custom max height', () => {
    renderDrawer({
      defaultOpen: true,
      contentProps: { maxHeight: 'calc(100dvh - 4.5rem)' },
    });

    expect(
      screen.getByRole('dialog').style
        .getPropertyValue('--drawer-max-height'),
    ).toBe('calc(100dvh - 4.5rem)');
  });
});

describe('DrawerContentInner', () => {
  test('renders its children inside the drawer', () => {
    renderDrawer({
      defaultOpen: true,
      innerProps: {
        children: <p>Body content</p>,
      },
    });

    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  test('renders the top area', () => {
    renderDrawer({
      defaultOpen: true,
      innerProps: {
        topArea: <span>Top area content</span>,
      },
    });

    expect(screen.getByText('Top area content')).toBeInTheDocument();
  });

  test('renders the footer area', () => {
    renderDrawer({
      defaultOpen: true,
      innerProps: {
        footerArea: <button type="button">Save</button>,
      },
    });

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  test('reserves footer height based on reservedFooterHeight', () => {
    renderDrawer({
      defaultOpen: true,
      innerProps: {
        reservedFooterHeight: 96,
        footerArea: <button type="button">Save</button>,
      },
    });

    const footer = screen.getByRole('button', { name: 'Save' })
      .parentElement?.parentElement;

    expect(
      footer?.style.getPropertyValue('--footer-reserved-height'),
    ).toBe('calc(96px + env(safe-area-inset-bottom, 0px) + var(--bleed))');
  });

  test('pads the bottom itself when there is no footer', () => {
    renderDrawer({
      defaultOpen: true,
      innerProps: { children: <p>Body content</p> },
    });

    expect(screen.getByText('Body content').parentElement?.parentElement)
      .toHaveClass('pb-[calc(env(safe-area-inset-bottom,0px)+var(--bleed))]');
  });
});
