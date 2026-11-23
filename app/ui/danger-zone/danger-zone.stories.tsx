import type { Meta, StoryObj } from '@storybook/react-vite';
import { DangerZone } from './danger-zone';
import { Button } from '../button/button';

/**
 * A red box for an action that cannot easily be undone, like deleting
 * the account at the bottom of the account settings.
 */
const meta: Meta<typeof DangerZone> = {
  title: 'Feedback/DangerZone',
  component: DangerZone,
  decorators: story => <div className="max-w-xl">{story()}</div>,
};

export default meta;
type Story = StoryObj<typeof DangerZone>;

export const Default: Story = {
  args: {
    title: 'Danger zone',
    description: 'Delete your account and every document in it. '
      + 'Sign in within 30 days to get it back.',
    actionArea: (
      <Button colorLight="red-500" className="whitespace-nowrap">
        Delete account
      </Button>
    ),
  },
};
