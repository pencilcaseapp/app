import type { Meta, StoryObj } from '@storybook/react-vite';
import { HorizontalOverflow } from './horizontal-overflow';

/**
 * The `HorizontalOverflow` component
 * is used to handle overflow in a horizontal direction.
 * It adds a gradient on the left and right side of the container to
 * indicate that there is more content to the left or right.
 */
const meta: Meta<typeof HorizontalOverflow> = {
  title: 'Utils/HorizontalOverflow',
  component: HorizontalOverflow,
  argTypes: {
    children: {
      table: {
        disable: true,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof HorizontalOverflow>;

export const Example: Story = {
  args: {
    children: (
      <div className="flex gap-2 flex-nowrap">
        <div className="w-64 h-20 rounded-lg bg-pca-grey-200 dark:bg-pca-grey-700 shrink-0"></div>
        <div className="w-64 h-20 rounded-lg bg-pca-grey-200 dark:bg-pca-grey-700 shrink-0"></div>
        <div className="w-64 h-20 rounded-lg bg-pca-grey-200 dark:bg-pca-grey-700 shrink-0"></div>
        <div className="w-64 h-20 rounded-lg bg-pca-grey-200 dark:bg-pca-grey-700 shrink-0"></div>
        <div className="w-64 h-20 rounded-lg bg-pca-grey-200 dark:bg-pca-grey-700 shrink-0"></div>
      </div>
    ),
  },
};
