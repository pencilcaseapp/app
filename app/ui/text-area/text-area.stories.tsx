import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from './text-area';

const meta: Meta<typeof TextArea> = {
  title: 'Forms/TextArea',
  component: TextArea,
};

export default meta;
type Story = StoryObj<typeof TextArea>;

export const Default: Story = {
  args: {
    id: 'details',
    label: 'Details',
    placeholder: 'What is wrong with it?',
  },
};

export const WithHint: Story = {
  args: {
    id: 'details',
    label: 'Details',
    hint: 'Optional',
  },
};

export const Disabled: Story = {
  args: {
    id: 'details',
    label: 'Details',
    disabled: true,
  },
};
