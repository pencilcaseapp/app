import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './avatar';

/** 🧑‍🎨 The `Avatar` component is used to display a user's avatar. */
const meta: Meta<typeof Avatar> = {
  title: 'Data Display/Avatar',
  component: Avatar,
  argTypes: {
    name: {
      control: { type: 'text' },
    },
    size: {
      control: { type: 'select' },
      options: ['small', 'large'],
    },
    color: {
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const small: Story = {
  args: {
    name: 'Pency Pencilton',
    size: 'small',
  },
};

export const large: Story = {
  args: {
    name: 'Pency Pencilton',
    size: 'large',
  },
};

export const CustomColors: Story = {
  render: () => (
    <div className="flex items-center -space-x-1.5">
      <Avatar name="Alice" color="oklch(63.7% 0.237 25.331)" size="small" />
      <Avatar name="Bob" color="oklch(72.3% 0.219 149.579)" size="small" />
      <Avatar name="Charlie" color="oklch(60.6% 0.25 292.717)" size="small" />
      <Avatar name="Diana" color="oklch(76.9% 0.188 70.08)" size="small" />
      <Avatar name="Eve" color="oklch(58.5% 0.233 277.117)" size="small" />
    </div>
  ),
};
