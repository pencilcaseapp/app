import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FolderSwitch } from './folder-switch';
import type { FolderSwitchItem } from './folder-switch';

const groups: FolderSwitchItem<string>[][] = [
  [
    { value: 'all', label: 'All Docs', icon: 'space', count: 46 },
    { value: 'shared', label: 'Shared with you', icon: 'users', count: 6 },
  ],
  [{ value: 'deleted', label: 'Deleted', icon: 'trash', count: 2 }],
];

function renderSwitch(onValueChange = vi.fn()) {
  return render(
    <FolderSwitch
      groups={groups}
      value="all"
      onValueChange={onValueChange}
    />,
  );
}

describe('FolderSwitch', () => {
  test('shows the open folder with its count', () => {
    renderSwitch();

    expect(screen.getByRole('combobox')).toHaveTextContent('All Docs46');
  });

  test('lists every folder with a count, the open one checked', async () => {
    const user = userEvent.setup();
    renderSwitch();

    await user.click(screen.getByRole('combobox'));

    expect(screen.getByRole('option', { name: /All Docs/ }))
      .toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTitle('Current folder')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Shared with you/ }))
      .toHaveTextContent('6');
    expect(screen.getByRole('option', { name: /Deleted/ }))
      .toHaveTextContent('2');
  });

  test('reports the folder that was picked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderSwitch(onValueChange);

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: /Deleted/ }));

    expect(onValueChange).toHaveBeenCalledWith('deleted');
  });
});
