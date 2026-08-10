import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from './empty-state';
import { Button } from '../button/button';

/**
 * Empty states are moments in an app where
 * there is no data to display to the user. They are most
 * commonly seen the first time a user interacts with the
 * product, but can be used when data has been deleted or is unavailable.
 */
const meta: Meta<typeof EmptyState> = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: story => (
    <div className="flex items-center justify-center h-screen">{story()}</div>
  ),
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

/**
 * A basic example with some content.
 */
export const Default: Story = {
  args: {
    title: 'Permission Denied',
    description:
        'You don’t have a permission to access this doc. Please ask the owner to share the doc with you.',
  },
};

/**
 * With an action area, which can be used to provide
 * a call to action for the user.
 */
export const ActionArea: Story = {
  args: {
    title: 'Permission Denied',
    description:
        'You don’t have a permission to access this doc. Please ask the owner to share the doc with you.',
    actionArea: (
      <Button>
        Request Access
      </Button>
    ),
  },
};
