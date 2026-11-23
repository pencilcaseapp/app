import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FolderSwitch } from './folder-switch';
import type { FolderSwitchItem } from './folder-switch';

/**
 * Switches the folder the navigation lists, with how many documents each
 * holds. A Base UI select on larger screens, and a sheet that stacks on
 * the sidebar's own below `sm` (resize the viewport to see it).
 */
const meta: Meta<typeof FolderSwitch> = {
  title: 'Navigation/FolderSwitch',
  component: FolderSwitch,
};

export default meta;
type Story = StoryObj<typeof FolderSwitch<string>>;

const groups: FolderSwitchItem<string>[][] = [
  [
    { value: 'all', label: 'All Docs', icon: 'space', count: 46 },
    { value: 'shared', label: 'Shared with you', icon: 'users', count: 6 },
  ],
  [{ value: 'deleted', label: 'Deleted', icon: 'trash', count: 2 }],
];

export const BasicExample: Story = {
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [value, setValue] = useState('all');

    return (
      <div className="w-62.5 p-3">
        <FolderSwitch groups={groups} value={value} onValueChange={setValue} />
      </div>
    );
  },
};
