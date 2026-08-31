import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { PlanComparison } from '../plan-comparison/plan-comparison';
import { PricingTable } from '../pricing-table/pricing-table';
import { UpgradeDialog } from './upgrade-dialog';

/**
 * `UpgradeDialog` is the upgrade prompt: a `ResponsiveDialog` with a
 * headline, an optional description and a slot for the pricing
 * content. Below Tailwind's `sm` breakpoint it opens as the bottom
 * sheet drawer.
 */
const meta: Meta<typeof UpgradeDialog> = {
  title: 'Overlay/UpgradeDialog',
  component: UpgradeDialog,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof UpgradeDialog>;

/**
 * The full upsell: the free plan compared against pro through
 * `PlanComparison`.
 */
export const Default: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <UpgradeDialog {...args} />
    </div>
  ),
  args: {
    headline: 'Need more docs?',
    description:
      'You have reached the limits of the free plan, '
      + 'but getting more is easy.',
    trigger: <Button colorLight="upgrade">Upgrade to Pro</Button>,
    pricingArea: (
      <PlanComparison
        currentPlan={{
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
        }}
        upgradePlan={{
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
        }}
      />
    ),
  },
};

/**
 * With a single pricing card in the slot the small dialog size fits
 * better.
 */
export const SinglePlan: Story = {
  render: args => (
    <div className="flex min-h-dvh items-center justify-center">
      <UpgradeDialog {...args} />
    </div>
  ),
  args: {
    headline: 'Go pro',
    size: 'small',
    trigger: <Button colorLight="upgrade">Upgrade to Pro</Button>,
    pricingArea: (
      <PricingTable
        plan="pencil case pro"
        amount="25 €"
        period="/ year"
        features={[
          'Unlimited docs',
          'Access control for collaboration',
          'Hosted in the EU',
        ]}
        actionArea={<Button className="w-full">Upgrade to Pro</Button>}
        finePrint="Secure checkout by Creem."
      />
    ),
  },
};
