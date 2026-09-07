import type { Meta, StoryObj } from '@storybook/react-vite';
import { PlanMatrix } from './plan-matrix';

/**
 * One row per feature, one narrow column per plan. Cells print a
 * value or show whether the feature is included; the emphasised plan
 * gets the strong text colour.
 */
const meta: Meta<typeof PlanMatrix> = {
  title: 'Data Display/PlanMatrix',
  component: PlanMatrix,
  decorators: [
    Story => (
      <div className="max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PlanMatrix>;

export const Default: Story = {
  args: {
    caption: 'What the free and the pro plan include',
    plans: [{ name: 'Free' }, { name: 'Pro', emphasis: true }],
    rows: [
      { label: 'Docs', cells: ['3', 'Unlimited'] },
      { label: 'Access control for collaboration', cells: [false, true] },
      { label: 'Hosted in the EU', cells: [true, true] },
      { label: 'No tracking', cells: [true, true] },
      { label: 'Support small tech', cells: [true, true] },
      { label: 'Support development', cells: [false, true] },
    ],
  },
};

/** In a drawer-wide column the feature labels still hold one line. */
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
