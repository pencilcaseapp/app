import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoadingIndicator } from './loading-indicator';

/** The loading indicator is used to indicate that a process is loading. */
const meta: Meta<typeof LoadingIndicator> = {
  title: 'Feedback/LoadingIndicator',
  component: LoadingIndicator,
};

export default meta;
type Story = StoryObj<typeof LoadingIndicator>;

export const Loading: Story = {
  render: () => <LoadingIndicator />,
};

/**
 * You can also take advantage of the `currentColor` value to inherit the color
 * from the parent element:
 */
export const LoadingWithParent: Story = {
  render: () => (
    <p className="text-pca-blue-500">
      Loading...
      <LoadingIndicator />
    </p>
  ),
};
