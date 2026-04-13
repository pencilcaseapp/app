import { describe, expect, test, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropdownMenu } from './dropdown-menu';
import { DropdownMenuTrigger } from './dropdown-menu-trigger';
import { DropdownMenuPortal } from './dropdown-menu-portal';
import { DropdownMenuContent } from './dropdown-menu-content';
import { DropdownMenuItem } from './dropdown-menu-item';
import { DropdownMenuSeparator } from './dropdown-menu-separator';

function renderDropdownMenu(
  { items, defaultOpen }:
  { items?: React.ReactNode; defaultOpen?: boolean } = {},
) {
  const defaultItems = (
    <>
      <DropdownMenuItem as="button">Edit</DropdownMenuItem>
      <DropdownMenuItem as="button">Share</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem as="button" color="danger">Delete</DropdownMenuItem>
    </>
  );

  return render(
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger />
      <DropdownMenuPortal>
        <DropdownMenuContent>
          {items ?? defaultItems}
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>,
  );
}

describe('DropdownMenu', () => {
  test('renders trigger button', () => {
    renderDropdownMenu();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('does not show menu content by default', () => {
    renderDropdownMenu();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('opens menu on trigger click', async () => {
    const user = userEvent.setup();
    renderDropdownMenu();

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  test('closes menu when an item is selected', async () => {
    const user = userEvent.setup();
    renderDropdownMenu();

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('calls onSelect when a menu item is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderDropdownMenu({
      items: (
        <DropdownMenuItem as="button" onSelect={onSelect}>Action</DropdownMenuItem>
      ),
    });

    await user.click(screen.getByRole('button'));
    await user.click(screen.getByRole('menuitem', { name: 'Action' }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  test('renders menu items with the danger color', async () => {
    const user = userEvent.setup();
    renderDropdownMenu();

    await user.click(screen.getByRole('button'));
    const deleteItem = screen.getByRole('menuitem', { name: 'Delete' });

    expect(deleteItem).toHaveClass('text-pca-red-500');
  });

  test('renders a disabled menu item', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    renderDropdownMenu({
      items: (
        <DropdownMenuItem as="button" disabled onSelect={onSelect}>
          Disabled action
        </DropdownMenuItem>
      ),
    });

    await user.click(screen.getByRole('button'));
    const item = screen.getByRole('menuitem', { name: 'Disabled action' });

    expect(item).toHaveClass('opacity-30');
    expect(item).toHaveClass('pointer-events-none');
  });

  test('renders a menu item with an icon', async () => {
    const user = userEvent.setup();

    renderDropdownMenu({
      items: (
        <DropdownMenuItem as="button" icon="share">Share</DropdownMenuItem>
      ),
    });

    await user.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');

    expect(within(menu).getByRole('menuitem', { name: 'Share' })).toBeInTheDocument();
    expect(menu.querySelector('svg')).toBeInTheDocument();
  });

  test('shows loading indicator when isLoading is set', async () => {
    const user = userEvent.setup();

    renderDropdownMenu({
      items: (
        <DropdownMenuItem as="button" isLoading>Saving</DropdownMenuItem>
      ),
    });

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('status', { name: 'loading' })).toBeInTheDocument();
  });

  test('renders separator between items', async () => {
    const user = userEvent.setup();
    renderDropdownMenu();

    await user.click(screen.getByRole('button'));

    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    renderDropdownMenu();

    await user.click(screen.getByRole('button'));
    await user.keyboard('{ArrowDown}');

    const items = screen.getAllByRole('menuitem');
    expect(items.length).toBe(3);
  });

  test('closes menu on Escape', async () => {
    const user = userEvent.setup();
    renderDropdownMenu();

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
