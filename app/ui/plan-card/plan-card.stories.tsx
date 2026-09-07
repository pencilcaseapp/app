import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge/badge';
import { PlanCard } from './plan-card';

/**
 * The compact pricing card: plan name and price on the surface of the
 * `PricingTable`, with a slot for a badge. Two of them sit in a row
 * above the `PlanMatrix` in the subscription settings.
 */
const meta: Meta<typeof PlanCard> = {
  title: 'Data Display/PlanCard',
  component: PlanCard,
  decorators: [
    Story => (
      <div className="w-56 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlanCard>;

export const Default: Story = {
  args: {
    plan: 'Pencil Case Pro',
    amount: '25 €',
    period: '/ year',
  },
};

export const Current: Story = {
  args: {
    ...Default.args,
    badge: <Badge variant="success">Current</Badge>,
  },
};

export const White: Story = {
  args: {
    plan: 'Pencil Case Free',
    amount: '0 €',
    period: '/ year',
    background: 'white',
    badge: <Badge>Current</Badge>,
  },
};

/** Two cards as they sit above the matrix: the badge slot is reserved
 * in both, so the prices share a baseline. */
export const Row: Story = {
  decorators: [
    Story => (
      <div className="w-md p-4">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      <PlanCard
        plan="Pencil Case Free"
        amount="0 €"
        period="/ year"
        background="white"
        badge={<Badge>Current</Badge>}
      />
      <PlanCard plan="Pencil Case Pro" amount="25 €" period="/ year" />
    </div>
  ),
};
