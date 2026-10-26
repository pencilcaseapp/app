/* eslint-disable @eslint-react/rules-of-hooks */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { NativeSelect } from './native-select';

const meta: Meta<typeof NativeSelect> = {
  title: 'Forms/NativeSelect',
  component: NativeSelect,
};

export default meta;
type Story = StoryObj<typeof NativeSelect>;

const items = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'other', label: 'Something else' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string>();

    return (
      <NativeSelect
        id="reason"
        label="Reason"
        placeholder="Choose a reason"
        items={items}
        value={value}
        onValueChange={setValue}
        className="w-80"
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    id: 'reason',
    label: 'Reason',
    items,
    value: 'spam',
    disabled: true,
    className: 'w-80',
  },
};
