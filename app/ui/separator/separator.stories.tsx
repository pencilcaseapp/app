import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './separator';

/**
 * A visual separator between content sections, built on Radix UI.
 * Supports horizontal and vertical orientations.
 */
const meta: Meta<typeof Separator> = {
  title: 'Data Display/Separator',
  component: Separator,
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="space-y-2">
      <p>Content above</p>
      <Separator />
      <p>Content below</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex items-center gap-2 h-6">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
