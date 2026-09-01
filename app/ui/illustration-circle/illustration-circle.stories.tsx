import type { Meta, StoryObj } from '@storybook/react-vite';
import { IllustrationCircle } from './illustration-circle';

/**
 * A yellow disc with an illustration peeking out of it, e.g. the
 * pencil on top of the upgrade offer. Hand it a 2x PNG with a
 * transparent background so it stays crisp on retina displays.
 */
const meta: Meta<typeof IllustrationCircle> = {
  title: 'Data Display/IllustrationCircle',
  component: IllustrationCircle,
};

export default meta;
type Story = StoryObj<typeof IllustrationCircle>;

export const Default: Story = {
  args: {
    src: '/upgrade-pencil@2x.png',
  },
};
