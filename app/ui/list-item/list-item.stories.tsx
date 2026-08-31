import type { Meta, StoryObj } from '@storybook/react-vite';
import { ListItem } from './list-item';

/**
 * One entry of a list, e.g. a feature on the pricing table: an icon
 * next to a short line of text.
 *
 * The icon defaults to `check` and can be swapped (`icon`). Icon and
 * text colors follow the theme by default (grey-900 light, white
 * dark) and can be set per theme via `iconColorLight`/`iconColorDark`
 * and `textColorLight`/`textColorDark`, e.g. green for success, red
 * for danger, or pinned colors for fixed surfaces like the yellow
 * pricing card.
 */
const meta: Meta<typeof ListItem> = {
  title: 'Data Display/ListItem',
  component: ListItem,
  decorators: [
    Story => (
      <ul className="flex flex-col gap-3">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const Default: Story = {
  args: {
    children: 'Unlimited docs',
  },
};

export const Success: Story = {
  args: {
    children: 'Hosted in the EU',
    iconColorLight: 'green-700',
    iconColorDark: 'green-700',
  },
};

export const Danger: Story = {
  args: {
    children: 'No access control',
    icon: 'close',
    iconColorLight: 'red-500',
    iconColorDark: 'red-500',
  },
};

/**
 * On the yellow pricing card icon and text are pinned to grey-900
 * in both themes.
 */
export const OnYellow: Story = {
  args: {
    children: 'Support small tech',
    iconColorDark: 'grey-900',
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
