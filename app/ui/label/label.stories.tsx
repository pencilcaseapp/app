import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './label';

/**
 * Label component for form labels
 */
const meta: Meta<typeof Label> = {
  title: 'Forms/Label',
  component: Label,
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    htmlFor: 'test',
    children: 'This is a label',
  },
};

export const Disabled: Story = {
  args: {
    htmlFor: 'test',
    children: 'This is a label',
    disabled: true,
  },
};
