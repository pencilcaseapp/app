import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from './tooltip';
import { Button } from '../button/button';

/**
 * The Tooltip component is used to display a tooltip on hover.
 * The component will automatically detect the best position to
 * display the tooltip. The example below demonstrates the tooltip
 * using an icon button. The component should only be used with a button.
 */
const meta: Meta<typeof Tooltip> = {
  title: 'Data Display/Tooltip',
  component: Tooltip,
  argTypes: {
    children: {
      control: false,
    },
    tooltip: {
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Primary: Story = {
  decorators: [
    Story => (
      <div className="w-full h-60 flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
  args: {
    align: 'center',
    children: <Button color="secondary" icon="h1" aria-label="Heading 1" />,
    tooltip: 'Heading 1',
  },
};
