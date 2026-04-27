import type { Meta, StoryObj } from '@storybook/react-vite';
import { StackedAvatars } from './stacked-avatar';

const meta: Meta<typeof StackedAvatars> = {
  title: 'Data Display/StackedAvatars',
  component: StackedAvatars,
};

export default meta;
type Story = StoryObj<typeof StackedAvatars>;

export const Default: Story = {
  args: {
    avatars: [
      { name: 'Alice', color: 'oklch(63.7% 0.237 25.331)' },
      { name: 'Bob', color: 'oklch(72.3% 0.219 149.579)' },
      { name: 'Charlie', color: 'oklch(60.6% 0.25 292.717)' },
    ],
  },
};

export const WithOverflow: Story = {
  args: {
    avatars: [
      { name: 'Alice', color: 'oklch(63.7% 0.237 25.331)' },
      { name: 'Bob', color: 'oklch(72.3% 0.219 149.579)' },
      { name: 'Charlie', color: 'oklch(60.6% 0.25 292.717)' },
      { name: 'Diana', color: 'oklch(76.9% 0.188 70.08)' },
      { name: 'Eve', color: 'oklch(58.5% 0.233 277.117)' },
      { name: 'Frank', color: 'oklch(65.4% 0.196 41.116)' },
      { name: 'Grace', color: 'oklch(69.8% 0.212 185.282)' },
    ],
    maxVisible: 5,
  },
};

export const SingleAvatar: Story = {
  args: {
    avatars: [
      { name: 'Alice', color: 'oklch(63.7% 0.237 25.331)' },
    ],
  },
};

export const CustomMaxVisible: Story = {
  args: {
    avatars: [
      { name: 'Alice', color: 'oklch(63.7% 0.237 25.331)' },
      { name: 'Bob', color: 'oklch(72.3% 0.219 149.579)' },
      { name: 'Charlie', color: 'oklch(60.6% 0.25 292.717)' },
      { name: 'Diana', color: 'oklch(76.9% 0.188 70.08)' },
      { name: 'Eve', color: 'oklch(58.5% 0.233 277.117)' },
      { name: 'Frank', color: 'oklch(65.4% 0.196 41.116)' },
      { name: 'Grace', color: 'oklch(69.8% 0.212 185.282)' },
    ],
    maxVisible: 3,
  },
};
