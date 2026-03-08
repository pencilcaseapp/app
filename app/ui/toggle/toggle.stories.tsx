import type { Meta, StoryObj } from '@storybook/react-vite';
import { Toggle } from './toggle';
import { useState } from 'react';

/**
 * Toggle component for switching between two states, such as on/off.
 */
const meta: Meta<typeof Toggle> = {
  title: 'Forms/Toggle',
  component: Toggle,
};

export default meta;
type Story = StoryObj<typeof Toggle>;

function ControlledExample() {
  const [value, setValue] = useState<boolean>(false);
  return (
    <Toggle
      isActive={value}
      onClick={() => setValue(prev => !prev)}
    >
      Toggle Me
    </Toggle>
  );
}

export const Controlled: Story = {
  render: () => <ControlledExample />,
};

export const Icon: Story = {
  args: {
    isActive: false,
    icon: 'h1',
    iconTitle: 'heading 1',
  },
};
