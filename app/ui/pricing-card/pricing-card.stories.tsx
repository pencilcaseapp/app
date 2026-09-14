import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../badge/badge';
import { Button } from '../button/button';
import { PricingCard } from './pricing-card';

/**
 * The pricing card: plan, price and optionally a feature list, an
 * action area for the caller's call to action and fine print. The
 * yellow surface keeps its colour in both themes and sits slightly
 * tilted, settling flat on hover; the white one follows the page.
 */
const meta: Meta<typeof PricingCard> = {
  title: 'Data Display/PricingCard',
  component: PricingCard,
  decorators: [
    Story => (
      <div className="w-82 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PricingCard>;

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
    actionArea: (
      <Button className="w-full" colorDark="grey-900">Upgrade to Pro</Button>
    ),
    finePrint: 'Secure checkout by Creem.',
  },
};

/**
 * Without an action area or fine print, e.g. purely informational.
 */
export const WithoutAction: Story = {
  args: {
    plan: 'Pencil Case Pro',
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
    plan: 'Pencil Case Free',
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

/**
 * The compact card: plan name and price only, with a slot for a
 * badge. Two of them sit in a row above the `PlanMatrix` in the
 * subscription settings.
 */
export const Compact: Story = {
  decorators: [
    Story => (
      <div className="w-56 p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    plan: 'Pencil Case Pro',
    amount: '25 €',
    period: '/ year',
    size: 'compact',
    badge: <Badge variant="success">Current</Badge>,
  },
};

/**
 * Two compact cards as they sit above the matrix: the badge slot is
 * reserved in both, so the prices share a baseline.
 */
export const CompactRow: Story = {
  decorators: [
    Story => (
      <div className="w-md p-4">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div className="grid grid-cols-2 gap-3">
      <PricingCard
        plan="Pencil Case Free"
        amount="0 €"
        period="/ year"
        background="white"
        size="compact"
        badge={<Badge>Current</Badge>}
      />
      <PricingCard
        plan="Pencil Case Pro"
        amount="25 €"
        period="/ year"
        size="compact"
      />
    </div>
  ),
};
