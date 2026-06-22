import type { Meta, StoryObj } from '@storybook/react-vite';
import { Notification } from './notification';

/**
 * 🔔 The `Notification` component is used to display a notification message to
 * the user.
 */
const meta: Meta<typeof Notification> = {
  title: 'Feedback/Notification',
  component: Notification,
};

export default meta;
type Story = StoryObj<typeof Notification>;

export const NotificationExample: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Notification title="We'd like to inform you that you are just awesome." />
      <Notification title="This is a notification message." description="Super long longer message which is super long and we need to have a long text because this is so informative and we know more after reading this.." />
      <Notification variant="success" title="Success comes from great people like you." />
      <Notification variant="warning" title="This is your last warning!" />
      <Notification variant="danger" title="Something went completly wrong. Run!" />
    </div>
  ),
};
