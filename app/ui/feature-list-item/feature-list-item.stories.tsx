import type { Meta, StoryObj } from '@storybook/react-vite';
import { FeatureListItem } from './feature-list-item';

/**
 * One entry of a feature list, e.g. on the pricing table: an icon
 * next to a short line of text.
 *
 * The icon defaults to the grey `check` and can be swapped
 * (`icon`) and recolored (`iconColor`: `success` and `danger`).
 * The text colors follow the theme by default and can be pinned via
 * `textColorLight`/`textColorDark` for fixed surfaces like the
 * yellow pricing card.
 */
const meta: Meta<typeof FeatureListItem> = {
  title: 'Data Display/FeatureListItem',
  component: FeatureListItem,
  decorators: [
    Story => (
      <ul className="flex flex-col gap-3">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FeatureListItem>;

export const Default: Story = {
  args: {
    children: 'Unlimited docs',
  },
};

export const Success: Story = {
  args: {
    children: 'Hosted in the EU',
    iconColor: 'success',
  },
};

export const Danger: Story = {
  args: {
    children: 'No access control',
    icon: 'close',
    iconColor: 'danger',
  },
};

/**
 * On the yellow pricing card the text is pinned to grey-900 in both
 * themes.
 */
export const OnYellow: Story = {
  args: {
    children: 'Support small tech',
    textColorDark: 'grey-900',
  },
  decorators: [
    Story => (
      <div className="w-70 rounded-2xl bg-pca-yellow-500 p-6">
        <Story />
      </div>
    ),
  ],
};
