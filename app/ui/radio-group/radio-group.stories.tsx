/* eslint-disable @eslint-react/rules-of-hooks */
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RadioGroup } from './radio-group';

const meta: Meta<typeof RadioGroup> = {
  title: 'Forms/RadioGroup',
  component: RadioGroup,
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

const items = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'other', label: 'Something else' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string>();

    return (
      <RadioGroup
        name="reason"
        label="Reason"
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
    label: 'Reason',
    items,
    value: 'spam',
    disabled: true,
    className: 'w-80',
  },
};
