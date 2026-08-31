import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './badge';

/**
 * 🏷️ The `Badge` component displays a short status label.
 */
const meta: Meta<typeof Badge> = {
  title: 'Feedback/Badge',
  component: Badge,
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const BadgeExample: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-3">
      <Badge>Status Badge</Badge>
      <Badge variant="success">Status Badge</Badge>
      <Badge variant="warning">Status Badge</Badge>
      <Badge variant="danger">Status Badge</Badge>
    </div>
  ),
};
