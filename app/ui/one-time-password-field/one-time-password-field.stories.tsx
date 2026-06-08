import type { Meta, StoryObj } from '@storybook/react-vite';
import { OneTimePasswordField } from './one-time-password-field';
import { useState } from 'react';

/**
 * OneTimePasswordField component for entering OTP codes
 */
const meta: Meta<typeof OneTimePasswordField> = {
  title: 'Forms/OneTimePasswordField',
  component: OneTimePasswordField,
};

export default meta;
type Story = StoryObj<typeof OneTimePasswordField>;

export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line @eslint-react/rules-of-hooks
    const [value, setValue] = useState('');

    return (
      <div className="w-full max-w-74">
        <OneTimePasswordField
          label="Verification Code"
          value={value}
          onValueChange={setValue}
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  decorators: [
    Story => (
      <div className="w-full max-w-74">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Verification Code',
    value: '123456',
    disabled: true,
  },
};

export const Hint: Story = {
  decorators: [
    Story => (
      <div className="w-full max-w-74">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Verification Code',
    value: '',
    hint: 'Enter the code sent to your email',
  },
};

export const Error: Story = {
  decorators: [
    Story => (
      <div className="w-full max-w-74">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Verification Code',
    value: '123456',
    errorMessage: 'Invalid code',
  },
};
