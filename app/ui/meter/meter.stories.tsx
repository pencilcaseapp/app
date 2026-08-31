import type { Meta, StoryObj } from '@storybook/react-vite';
import { Meter } from './meter';

/**
 * Meter for visualizing a value within a known range, e.g. how many
 * free documents are left before an upgrade is needed.
 *
 * Built on the [Base UI Meter](https://base-ui.com/react/components/meter),
 * which provides the `role="meter"` element, the `aria-value*`
 * attributes, and sizes the indicator to the value.
 */
const meta: Meta<typeof Meter> = {
  title: 'Feedback/Meter',
  component: Meter,
  decorators: [
    Story => (
      <div className="w-75">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Meter>;

export const Default: Story = {
  args: {
    label: '1 free doc(s) left.',
    value: 90,
  },
};

export const CustomRange: Story = {
  args: {
    label: '2 free doc(s) left.',
    value: 1,
    max: 3,
  },
};

export const Empty: Story = {
  args: {
    label: '3 free doc(s) left.',
    value: 0,
    max: 3,
  },
};

export const Full: Story = {
  args: {
    label: '0 free doc(s) left.',
    value: 3,
    max: 3,
  },
};
