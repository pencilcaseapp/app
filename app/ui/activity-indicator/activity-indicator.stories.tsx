import type { Meta, StoryObj } from '@storybook/react-vite';
import { ActivityIndicator } from './activity-indicator';

/**
 * The spinning wheel of iOS. Pull to refresh reveals it spoke by spoke
 * through `progress` and spins it once the pull is long enough.
 */
const meta: Meta<typeof ActivityIndicator> = {
  title: 'Feedback/ActivityIndicator',
  component: ActivityIndicator,
  args: {
    progress: 1,
    spinning: true,
    className: 'text-pca-grey-500 dark:text-pca-grey-400',
  },
  argTypes: {
    progress: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityIndicator>;

export const Spinning: Story = {};

export const Pulling: Story = {
  args: {
    progress: 0.5,
    spinning: false,
  },
};
