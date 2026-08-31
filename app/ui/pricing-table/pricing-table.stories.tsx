import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../button/button';
import { PricingTable } from './pricing-table';

/**
 * The yellow pricing card: plan, price, feature list and an action
 * area for the caller's call to action. It keeps its yellow surface
 * in both themes and sits slightly tilted, settling flat on hover.
 */
const meta: Meta<typeof PricingTable> = {
  title: 'Data Display/PricingTable',
  component: PricingTable,
  decorators: [
    Story => (
      <div className="w-82 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PricingTable>;

export const Default: Story = {
  args: {
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
};

/**
 * Without an action area or fine print, e.g. purely informational.
 */
export const WithoutAction: Story = {
  args: {
    plan: 'pencil case pro',
    amount: '25 €',
    period: '/ year',
    features: [
      'Unlimited docs',
      'Hosted in the EU',
    ],
  },
};

/**
 * On a white background the card follows the theme and lies flat,
 * e.g. to compare the free plan against pro.
 */
export const OnWhite: Story = {
  args: {
    plan: 'pencil case free',
    amount: '0 €',
    period: '/ year',
    background: 'white',
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
};
