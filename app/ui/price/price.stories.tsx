import type { Meta, StoryObj } from '@storybook/react-vite';
import { Price } from './price';

/**
 * A price with its billing period, e.g. on the pricing table.
 *
 * The `background` prop picks the color set for the surface the
 * price sits on: the yellow pricing card (which stays yellow in both
 * themes) or the plain white/dark page background.
 */
const meta: Meta<typeof Price> = {
  title: 'Data Display/Price',
  component: Price,
};

export default meta;
type Story = StoryObj<typeof Price>;

/**
 * On the yellow pricing card the colors are fixed for both themes.
 */
export const OnYellow: Story = {
  args: {
    amount: '25 €',
    period: '/ year',
  },
  decorators: [
    Story => (
      <div className="rounded-2xl bg-pca-yellow-500 p-6">
        <Story />
      </div>
    ),
  ],
};

/**
 * On the page background the price follows the theme.
 */
export const OnWhite: Story = {
  args: {
    amount: '25 €',
    period: '/ year',
    background: 'white',
  },
};
