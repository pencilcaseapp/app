import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpgradeTeaser } from './upgrade-teaser';

/**
 * ✨ The `UpgradeTeaser` sells a feature that is behind a paid plan,
 * e.g. inviting people by email in the share panel of a free account.
 *
 * All of its copy comes from props, and the yellow fill stays the same
 * in both themes.
 *
 * # Render as a React Router Link
 *
 * Pass the component of the routing library to the `as` prop to keep
 * the navigation client side.
 *
 * ```tsx
 * import { Link } from 'react-router';
 * ...
 *
 * <UpgradeTeaser
 *   as={Link}
 *   to="/upgrade"
 *   plan="Pro"
 *   title="Invite people by email"
 *   action="Upgrade"
 * />
 * ```
 */
const meta: Meta<typeof UpgradeTeaser> = {
  title: 'Feedback/UpgradeTeaser',
  component: UpgradeTeaser,
  decorators: [
    Story => (
      <div className="w-95">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof UpgradeTeaser>;

export const Default: Story = {
  args: {
    href: '#upgrade',
    plan: 'Pro',
    title: 'Invite people by email',
    action: 'Upgrade',
  },
};

export const LongTitle: Story = {
  args: {
    href: '#upgrade',
    plan: 'Pro',
    title: 'Invite as many people as you like by email address',
    action: 'Upgrade',
  },
};

export const AsButton: Story = {
  args: {
    as: 'button',
    type: 'button',
    plan: 'Team',
    title: 'Share with your whole team',
    action: 'See plans',
  },
};
