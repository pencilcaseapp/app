import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from './text-field';

/**
 * TextField component for user input
 */
const meta: Meta<typeof TextField> = {
  title: 'Forms/TextField',
  component: TextField,
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Text: Story = {
  args: {
    id: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'e.g. John Doe',
  },
};

export const Disabled: Story = {
  args: {
    id: 'name',
    type: 'text',
    value: '',
    label: 'Name',
    placeholder: 'e.g. John Doe',
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    id: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'e.g. John Doe',
    errorMessage: 'Please enter a valid name',
  },
};

export const WithHint: Story = {
  args: {
    id: 'name',
    type: 'text',
    label: 'Name',
    placeholder: 'e.g. John Doe',
    hint: 'Your full name is required',
  },
};
