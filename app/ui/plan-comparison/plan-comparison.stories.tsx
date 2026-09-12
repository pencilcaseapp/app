import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { PlanComparison } from './plan-comparison';

/**
 * `PlanComparison` puts the current plan next to the yellow upgrade
 * card, e.g. inside the `UpgradeDialog`. The columns follow the
 * container: below 32rem the cards stack with the upgrade on top.
 */
const meta: Meta<typeof PlanComparison> = {
  title: 'Data Display/PlanComparison',
  component: PlanComparison,
  decorators: [
    Story => (
      <div className="max-w-2xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlanComparison>;

export const Default: Story = {
  args: {
    currentPlan: {
      plan: 'pencil case free',
      amount: '0 €',
      period: '/ year',
      features: [
        '3 docs',
        'Hosted in the EU',
        'Support small tech',
      ],
      missingFeatures: [
        'Unlimited docs',
        'Access control for collaboration',
      ],
    },
    upgradePlan: {
      plan: 'pencil case pro',
      amount: '25 €',
      period: '/ year',
      features: [
        'Unlimited docs',
        'Access control for collaboration',
        'Hosted in the EU',
        'Support small tech',
        'Support development',
      ],
      actionArea: <Button className="w-full">Upgrade to Pro</Button>,
      finePrint: 'Secure checkout by Creem.',
    },
  },
};

/**
 * In a column narrower than 32rem, e.g. the settings dialog on a
 * tablet or the bottom sheet, the cards stack with the upgrade first.
 */
export const Narrow: Story = {
  decorators: [
    Story => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  args: Default.args,
};
