import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from './logo';

/**
 * Just our logo
 */
const meta: Meta<typeof Logo> = {
  title: 'Data Display/Logo',
  component: Logo,
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {};
