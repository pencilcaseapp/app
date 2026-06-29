import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from './checkbox';
import { useState } from 'react';

/**
 * Checkbox component for user input
 */
const meta: Meta<typeof Checkbox> = {
  title: 'Forms/Checkbox',
  component: Checkbox,
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Controlled: Story = {
  render: (args) => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        {...args}
        checked={checked}
        onChange={() => setChecked(prev => !prev)}
      />
    );
  },
  args: {
    id: 'accept-terms',
    label: 'Accept Terms and Conditions',
  },
};

export const Disabled: Story = {
  args: {
    id: 'accept-terms',
    label: 'Accept Terms and Conditions',
    disabled: true,
    checked: false,
  },
};

export const WithError: Story = {
  args: {
    id: 'accept-terms',
    label: 'Accept Terms and Conditions',
    errorMessage: 'You must accept the terms and conditions',
    checked: false,
  },
};

export const WithHint: Story = {
  args: {
    id: 'accept-terms',
    label: 'Accept Terms and Conditions',
    hint: 'You must accept the terms and conditions',
    checked: false,
  },
};

export const WithLongLabel: Story = {
  decorators: [
    Story => (
      <div style={{ maxWidth: '300px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    id: 'accept-terms',
    label: 'I have read and agree to the Terms and Conditions of this service, including any updates or changes that may occur in the future.',
    checked: false,
  },
};
