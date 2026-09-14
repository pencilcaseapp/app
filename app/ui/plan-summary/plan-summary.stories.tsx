import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge/badge';
import { PlanSummary } from './plan-summary';

/**
 * The header of a subscription plan: the product above the plan name,
 * an optional badge next to it, the price line and a muted detail
 * line, e.g. the renewal date of a running subscription.
 */
const meta: Meta<typeof PlanSummary> = {
  title: 'Data Display/PlanSummary',
  component: PlanSummary,
  decorators: [
    Story => (
      <div className="w-82 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlanSummary>;

export const Default: Story = {
  args: {
    product: 'Pencil Case',
    plan: 'Pro',
    price: '25 €',
    period: 'renews yearly',
  },
};

/**
 * With a status badge and the renewal date, e.g. a running
 * subscription.
 */
export const WithStatus: Story = {
  args: {
    ...Default.args,
    badge: <Badge variant="success">Active</Badge>,
    detail: 'Renews at: 06.07.2026',
  },
};

/**
 * Without a price line, e.g. a plan handed out for free.
 */
export const WithoutPrice: Story = {
  args: {
    product: 'Pencil Case',
    plan: 'Pro',
    badge: <Badge variant="success">Active</Badge>,
    detail: 'On the house. Enjoy!',
  },
};
