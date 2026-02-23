import type { Meta, StoryObj } from '@storybook/react-vite';
import { Editor } from './editor';

const meta = {
  title: 'Editor/Editor',
  component: Editor,
} satisfies Meta<typeof Editor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    placeholder: <div>Start here …</div>,
    ariaPlaceholder: 'Start here …',
    avatars: [],
  },
};

export const WithAvatars: Story = {
  args: {
    placeholder: <div>Start here …</div>,
    ariaPlaceholder: 'Start here …',
    avatars: ['Alice', 'Bob', 'Charlie'],
  },
};
